package api

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
)

// apiError — тело ответа с ошибкой: машинный код для фронтенда и текст для людей.
type apiError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		if err := json.NewEncoder(w).Encode(v); err != nil {
			slog.Warn("ответ не отправлен", "err", err)
		}
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, apiError{Error: code, Message: message})
}

func internalError(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("ошибка сервера", "method", r.Method, "path", r.URL.Path, "err", err)
	writeError(w, http.StatusInternalServerError, "internal", "Внутренняя ошибка сервера")
}

// readJSON разбирает тело запроса не больше limit байт; неизвестные поля — ошибка.
func readJSON(w http.ResponseWriter, r *http.Request, limit int64, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, limit)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeError(w, http.StatusRequestEntityTooLarge, "too_large", "Слишком большой запрос")
			return false
		}
		writeError(w, http.StatusBadRequest, "bad_json", "Некорректный JSON: "+err.Error())
		return false
	}
	if _, err := dec.Token(); !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "bad_json", "Некорректный JSON: лишние данные после объекта")
		return false
	}
	return true
}
