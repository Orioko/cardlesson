package api

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"runtime/debug"
	"slices"
	"strings"
	"time"

	"cardlesson/internal/store"
)

type ctxKey int

const userKey ctxKey = 0

// currentUser — пользователь, которого requireAuth положил в контекст запроса.
func currentUser(r *http.Request) store.User {
	return r.Context().Value(userKey).(store.User)
}

// requireAuth пропускает запрос дальше только с живым токеном в заголовке Authorization.
func (s *Server) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, ok := bearerToken(r)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized", "Нужно войти")
			return
		}
		user, err := s.store.UserBySession(r.Context(), hashToken(token))
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusUnauthorized, "unauthorized", "Сессия истекла, войдите снова")
			return
		}
		if err != nil {
			internalError(w, r, err)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), userKey, user)))
	}
}

func bearerToken(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(h, "Bearer ")
	token = strings.TrimSpace(token)
	return token, ok && token != ""
}

// cors разрешает запросы только с адресов из CARDLESSON_ALLOWED_ORIGINS.
// Токен идёт в заголовке, а не в cookie, поэтому чужой сайт не может действовать от имени пользователя.
func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		w.Header().Add("Vary", "Origin")
		if origin != "" && slices.Contains(s.cfg.AllowedOrigins, origin) {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", origin)
			h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			h.Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// statusRecorder запоминает код ответа для лога.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// logAndRecover пишет строку лога на каждый запрос и не даёт панике уронить сервер.
func logAndRecover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		defer func() {
			if p := recover(); p != nil {
				slog.Error("паника в обработчике", "path", r.URL.Path, "panic", p, "stack", string(debug.Stack()))
				writeError(rec, http.StatusInternalServerError, "internal", "Внутренняя ошибка сервера")
			}
			slog.Info("запрос", "method", r.Method, "path", r.URL.Path, "status", rec.status,
				"ms", time.Since(start).Milliseconds())
		}()
		rec.Header().Set("X-Content-Type-Options", "nosniff")
		rec.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(rec, r)
	})
}

// clientIP — адрес клиента. За Caddy это последний адрес в X-Forwarded-For:
// его дописал сам Caddy, а всё, что левее, мог подставить кто угодно.
func (s *Server) clientIP(r *http.Request) string {
	if s.cfg.TrustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[len(parts)-1])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
