package api

import (
	"net/http"
	"strconv"
	"time"

	"cardlesson/internal/store"
)

type timerRecordJSON struct {
	Minutes        int   `json:"minutes"`
	WordsCompleted int   `json:"wordsCompleted"`
	Date           int64 `json:"date"`
}

// listTimerRecords отдаёт рекорды в формате фронтенда: { "1": [...], "3": [...] }.
func (s *Server) listTimerRecords(w http.ResponseWriter, r *http.Request) {
	records, err := s.store.ListTimerRecords(r.Context(), currentUser(r).ID)
	if err != nil {
		internalError(w, r, err)
		return
	}
	out := map[string][]timerRecordJSON{}
	for _, rec := range records {
		key := strconv.Itoa(rec.Minutes)
		out[key] = append(out[key], timerRecordJSON{Minutes: rec.Minutes, WordsCompleted: rec.WordsCompleted, Date: rec.Date})
	}
	writeJSON(w, http.StatusOK, out)
}

// addTimerRecord сохраняет результат. date можно передать при переносе старых рекордов из браузера.
func (s *Server) addTimerRecord(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Minutes        int   `json:"minutes"`
		WordsCompleted int   `json:"wordsCompleted"`
		Date           int64 `json:"date"`
	}
	if !readJSON(w, r, smallBody, &in) {
		return
	}
	if in.Minutes < 1 || in.Minutes > 240 || in.WordsCompleted < 0 || in.WordsCompleted > 1_000_000 {
		writeError(w, http.StatusBadRequest, "invalid_record", "Некорректный результат таймера")
		return
	}
	if in.Date > time.Now().Add(time.Hour).UnixMilli() {
		in.Date = 0 // дата из будущего — ставим текущее время
	}
	rec := store.TimerRecord{Minutes: in.Minutes, WordsCompleted: in.WordsCompleted, Date: in.Date}
	if err := s.store.AddTimerRecord(r.Context(), currentUser(r).ID, rec); err != nil {
		internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) clearTimerRecords(w http.ResponseWriter, r *http.Request) {
	if err := s.store.ClearTimerRecords(r.Context(), currentUser(r).ID); err != nil {
		internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
