package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"cardlesson/internal/store"
)

// Те же правила, что во фронтенде (src/constants/validation.ts): email или короткий логин.
var (
	emailRe      = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	localLoginRe = regexp.MustCompile(`^[a-zA-Z0-9._-]{2,64}$`)
)

const (
	minPasswordLen = 8
	maxPasswordLen = 72 // bcrypt учитывает только первые 72 байта
	maxLoginLen    = 254
)

// dummyHash — с ним сверяем пароль, если логина нет: ответ приходит так же долго,
// и по времени нельзя узнать, зарегистрирован ли email.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("cardlesson-dummy-password"), bcrypt.DefaultCost)

type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userJSON struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type authResponse struct {
	Token string   `json:"token"`
	User  userJSON `json:"user"`
}

func toUserJSON(u store.User) userJSON {
	name, _, _ := strings.Cut(u.Login, "@")
	return userJSON{ID: u.ID, Email: u.Login, Name: name}
}

// NormalizeLogin приводит логин к виду, в котором он хранится: без пробелов по краям, в нижнем регистре.
func NormalizeLogin(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func validateCredentials(c credentials) (string, string) {
	login := NormalizeLogin(c.Email)
	if login == "" {
		return "", "Введите email"
	}
	if len(login) > maxLoginLen || (!emailRe.MatchString(login) && !localLoginRe.MatchString(login)) {
		return "", "Неверный формат email"
	}
	if msg := ValidatePassword(c.Password); msg != "" {
		return "", msg
	}
	return login, ""
}

// ValidatePassword — пустая строка, если пароль подходит, иначе текст ошибки.
func ValidatePassword(p string) string {
	switch {
	case p == "":
		return "Введите пароль"
	case len(p) < minPasswordLen:
		return "Пароль должен содержать минимум 8 символов"
	case len(p) > maxPasswordLen:
		return "Пароль слишком длинный: максимум 72 байта"
	}
	return ""
}

// HashPassword — bcrypt-хеш для хранения в базе.
func HashPassword(p string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(p), bcrypt.DefaultCost)
	return string(h), err
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	if !s.authLimit.Allow(s.clientIP(r)) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "Слишком много попыток, подождите минуту")
		return
	}
	var c credentials
	if !readJSON(w, r, smallBody, &c) {
		return
	}
	login, msg := validateCredentials(c)
	if msg != "" {
		writeError(w, http.StatusBadRequest, "invalid_credentials", msg)
		return
	}
	hash, err := HashPassword(c.Password)
	if err != nil {
		internalError(w, r, err)
		return
	}
	user, err := s.store.CreateUser(r.Context(), login, hash)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "user_exists", "Пользователь с таким email уже существует")
		return
	}
	if err != nil {
		internalError(w, r, err)
		return
	}
	s.startSession(w, r, user, http.StatusCreated)
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if !s.authLimit.Allow(s.clientIP(r)) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "Слишком много попыток, подождите минуту")
		return
	}
	var c credentials
	if !readJSON(w, r, smallBody, &c) {
		return
	}
	login := NormalizeLogin(c.Email)
	if !s.loginLimit.Allow(login) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "Слишком много попыток входа в этот аккаунт, попробуйте позже")
		return
	}
	user, err := s.store.UserByLogin(r.Context(), login)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		internalError(w, r, err)
		return
	}
	hash := dummyHash
	if err == nil {
		hash = []byte(user.PasswordHash)
	}
	if bcrypt.CompareHashAndPassword(hash, []byte(c.Password)) != nil || err != nil {
		writeError(w, http.StatusUnauthorized, "wrong_credentials", "Неверный email или пароль")
		return
	}
	s.startSession(w, r, user, http.StatusOK)
}

func (s *Server) startSession(w http.ResponseWriter, r *http.Request, user store.User, status int) {
	token, err := newToken()
	if err != nil {
		internalError(w, r, err)
		return
	}
	if err := s.store.CreateSession(r.Context(), hashToken(token), user.ID, s.cfg.SessionTTL); err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, status, authResponse{Token: token, User: toUserJSON(user)})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	token, _ := bearerToken(r)
	if err := s.store.DeleteSession(r.Context(), hashToken(token)); err != nil {
		internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, toUserJSON(currentUser(r)))
}

// newToken — 32 случайных байта; в базе хранится только SHA-256 от токена,
// так что утечка базы не даёт войти под чужой сессией.
func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "cl_" + base64.RawURLEncoding.EncodeToString(b), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
