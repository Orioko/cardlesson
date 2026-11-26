// Package api — HTTP API CardLesson: вход, слова, настройки и рекорды таймера.
package api

import (
	"context"
	"net/http"
	"time"

	"cardlesson/internal/config"
	"cardlesson/internal/store"
)

const (
	smallBody  = 64 << 10 // обычные запросы
	importBody = 8 << 20  // импорт словаря из файла
	maxWords   = 20000    // слов на одного пользователя
)

type Server struct {
	cfg        config.Config
	store      *store.Store
	authLimit  *rateLimiter
	loginLimit *rateLimiter
}

func New(cfg config.Config, st *store.Store) *Server {
	return &Server{
		cfg:   cfg,
		store: st,
		// 10 попыток входа подряд с одного IP, дальше одна попытка в 6 секунд
		authLimit: newRateLimiter(10, 6*time.Second),
		// и не больше 20 попыток подряд на один логин с любых адресов, дальше одна в 30 секунд:
		// перебор пароля конкретного аккаунта через множество IP упирается в этот лимит
		loginLimit: newRateLimiter(20, 30*time.Second),
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", s.health)

	mux.HandleFunc("POST /api/auth/register", s.register)
	mux.HandleFunc("POST /api/auth/login", s.login)
	mux.HandleFunc("POST /api/auth/logout", s.requireAuth(s.logout))
	mux.HandleFunc("GET /api/auth/me", s.requireAuth(s.me))

	mux.HandleFunc("GET /api/words", s.requireAuth(s.listWords))
	mux.HandleFunc("POST /api/words", s.requireAuth(s.createWord))
	mux.HandleFunc("POST /api/words/import", s.requireAuth(s.importWords))
	mux.HandleFunc("POST /api/words/dedupe", s.requireAuth(s.dedupeWords))
	mux.HandleFunc("PATCH /api/words/{id}", s.requireAuth(s.updateWord))
	mux.HandleFunc("DELETE /api/words/{id}", s.requireAuth(s.deleteWord))

	mux.HandleFunc("GET /api/settings", s.requireAuth(s.getSettings))
	mux.HandleFunc("PUT /api/settings", s.requireAuth(s.putSettings))

	mux.HandleFunc("GET /api/timer-records", s.requireAuth(s.listTimerRecords))
	mux.HandleFunc("POST /api/timer-records", s.requireAuth(s.addTimerRecord))
	mux.HandleFunc("DELETE /api/timer-records", s.requireAuth(s.clearTimerRecords))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not_found", "Нет такого адреса API")
	})

	return logAndRecover(s.cors(mux))
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := s.store.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "db_unavailable", "База недоступна")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// RunMaintenance раз в час удаляет просроченные сессии и чистит счётчики попыток входа.
func (s *Server) RunMaintenance(ctx context.Context) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		s.store.DeleteExpiredSessions(ctx)
		s.authLimit.Cleanup()
		s.loginLimit.Cleanup()
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
