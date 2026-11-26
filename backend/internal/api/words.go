package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"cardlesson/internal/dedupe"
	"cardlesson/internal/store"
)

const maxFieldLen = 300 // символов в одном поле слова

type translationsJSON struct {
	Ru string `json:"ru"`
	En string `json:"en"`
	Ko string `json:"ko"`
}

// wordJSON — слово в том виде, в каком его ждёт фронтенд (тип Word из shared/types/word.ts).
type wordJSON struct {
	ID           string           `json:"id"`
	Ru           string           `json:"ru"`
	En           string           `json:"en"`
	Ko           string           `json:"ko"`
	Translations translationsJSON `json:"translations"`
	UserID       string           `json:"userId"`
	CreatedAt    string           `json:"createdAt"`
}

// wordInput — новое слово. id, userId и createdAt принимаем, чтобы импорт файла,
// выгруженного из приложения, проходил как есть, но id и userId сервер назначает сам.
type wordInput struct {
	Ru           string            `json:"ru"`
	En           string            `json:"en"`
	Ko           string            `json:"ko"`
	Translations *translationsJSON `json:"translations"`
	ID           json.RawMessage   `json:"id"`
	UserID       json.RawMessage   `json:"userId"`
	CreatedAt    json.RawMessage   `json:"createdAt"`
}

// wordPatch — частичное обновление: меняются только переданные поля.
type wordPatch struct {
	Ru           *string `json:"ru"`
	En           *string `json:"en"`
	Ko           *string `json:"ko"`
	Translations *struct {
		Ru *string `json:"ru"`
		En *string `json:"en"`
		Ko *string `json:"ko"`
	} `json:"translations"`
	ID        json.RawMessage `json:"id"`
	UserID    json.RawMessage `json:"userId"`
	CreatedAt json.RawMessage `json:"createdAt"`
}

func toWordJSON(w store.Word) wordJSON {
	return wordJSON{
		ID: w.ID, Ru: w.Ru, En: w.En, Ko: w.Ko,
		Translations: translationsJSON{Ru: w.TrRu, En: w.TrEn, Ko: w.TrKo},
		UserID:       w.UserID,
		CreatedAt:    time.UnixMilli(w.CreatedAt).UTC().Format("2006-01-02T15:04:05.000Z"),
	}
}

func dedupeValues(w store.Word) dedupe.Values {
	return dedupe.Values{Ru: w.Ru, En: w.En, Ko: w.Ko, TrRu: w.TrRu, TrEn: w.TrEn, TrKo: w.TrKo}
}

// fromInput собирает слово из запроса; пустой перевод берётся из основного поля, как при импорте во фронтенде.
func fromInput(in wordInput) store.Word {
	w := store.Word{Ru: strings.TrimSpace(in.Ru), En: strings.TrimSpace(in.En), Ko: strings.TrimSpace(in.Ko)}
	if in.Translations != nil {
		w.TrRu = strings.TrimSpace(in.Translations.Ru)
		w.TrEn = strings.TrimSpace(in.Translations.En)
		w.TrKo = strings.TrimSpace(in.Translations.Ko)
	}
	w.TrRu = cmpOr(w.TrRu, w.Ru)
	w.TrEn = cmpOr(w.TrEn, w.En)
	w.TrKo = cmpOr(w.TrKo, w.Ko)
	w.CreatedAt = parseCreatedAt(in.CreatedAt)
	return w
}

func cmpOr(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

// parseCreatedAt понимает ISO-строку и число миллисекунд; иначе 0 — время поставит база.
func parseCreatedAt(raw json.RawMessage) int64 {
	if len(raw) == 0 {
		return 0
	}
	var ms float64
	if json.Unmarshal(raw, &ms) == nil && ms > 0 {
		return int64(ms)
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
			return t.UnixMilli()
		}
	}
	return 0
}

// validateWord — текст ошибки или пустая строка. Слово должно быть заполнено минимум на двух языках.
func validateWord(w store.Word) string {
	for _, v := range []string{w.Ru, w.En, w.Ko, w.TrRu, w.TrEn, w.TrKo} {
		if utf8.RuneCountInString(v) > maxFieldLen {
			return "Слишком длинное значение: максимум 300 символов"
		}
	}
	if len(dedupe.Normalized(dedupeValues(w))) < 2 {
		return "Заполните минимум два языка"
	}
	return ""
}

func (s *Server) listWords(w http.ResponseWriter, r *http.Request) {
	words, err := s.store.ListWords(r.Context(), currentUser(r).ID)
	if err != nil {
		internalError(w, r, err)
		return
	}
	out := make([]wordJSON, len(words))
	for i, word := range words {
		out[i] = toWordJSON(word)
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) createWord(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	var in wordInput
	if !readJSON(w, r, smallBody, &in) {
		return
	}
	word := fromInput(in)
	// Время создания можно передать: слово, добавленное офлайн, сохраняет дату добавления.
	// Дату из будущего не принимаем — тогда время сервера.
	if word.CreatedAt > time.Now().Add(time.Hour).UnixMilli() {
		word.CreatedAt = 0
	}
	if msg := validateWord(word); msg != "" {
		writeError(w, http.StatusBadRequest, "invalid_word", msg)
		return
	}
	existing, err := s.store.ListWords(r.Context(), user.ID)
	if err != nil {
		internalError(w, r, err)
		return
	}
	if len(existing) >= maxWords {
		writeError(w, http.StatusUnprocessableEntity, "too_many_words", "В словаре уже максимум слов")
		return
	}
	if s.indexOf(existing).Has(dedupeValues(word)) {
		writeError(w, http.StatusConflict, "duplicate_word", "Такое слово уже есть в словаре")
		return
	}
	saved, err := s.store.InsertWords(r.Context(), user.ID, []store.Word{word})
	if err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toWordJSON(saved[0]))
}

func (s *Server) indexOf(words []store.Word) *dedupe.Index {
	vals := make([]dedupe.Values, len(words))
	for i, w := range words {
		vals[i] = dedupeValues(w)
	}
	return dedupe.NewIndex(vals)
}

type importRequest struct {
	Words []wordInput `json:"words"`
}

type importResponse struct {
	AddedCount      int        `json:"addedCount"`
	DuplicatesCount int        `json:"duplicatesCount"`
	ErrorCount      int        `json:"errorCount"`
	Words           []wordJSON `json:"words"`
}

// importWords добавляет пачку слов: дубли (с базой и внутри пачки) пропускаются,
// слова меньше чем на двух языках считаются ошибками.
func (s *Server) importWords(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	var req importRequest
	if !readJSON(w, r, importBody, &req) {
		return
	}
	existing, err := s.store.ListWords(r.Context(), user.ID)
	if err != nil {
		internalError(w, r, err)
		return
	}
	idx := s.indexOf(existing)
	resp := importResponse{Words: []wordJSON{}}
	var toAdd []store.Word
	for _, in := range req.Words {
		word := fromInput(in)
		switch {
		case validateWord(word) != "":
			resp.ErrorCount++
		case idx.Has(dedupeValues(word)):
			resp.DuplicatesCount++
		case len(existing)+len(toAdd) >= maxWords:
			resp.ErrorCount++
		default:
			idx.Add(dedupeValues(word))
			toAdd = append(toAdd, word)
		}
	}
	saved, err := s.store.InsertWords(r.Context(), user.ID, toAdd)
	if err != nil {
		internalError(w, r, err)
		return
	}
	resp.AddedCount = len(saved)
	for _, word := range saved {
		resp.Words = append(resp.Words, toWordJSON(word))
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) updateWord(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	var p wordPatch
	if !readJSON(w, r, smallBody, &p) {
		return
	}
	word, err := s.store.GetWord(r.Context(), user.ID, r.PathValue("id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "word_not_found", "Слово не найдено")
		return
	}
	if err != nil {
		internalError(w, r, err)
		return
	}
	set := func(dst *string, v *string) {
		if v != nil {
			*dst = strings.TrimSpace(*v)
		}
	}
	set(&word.Ru, p.Ru)
	set(&word.En, p.En)
	set(&word.Ko, p.Ko)
	if p.Translations != nil {
		set(&word.TrRu, p.Translations.Ru)
		set(&word.TrEn, p.Translations.En)
		set(&word.TrKo, p.Translations.Ko)
	}
	if msg := validateWord(word); msg != "" {
		writeError(w, http.StatusBadRequest, "invalid_word", msg)
		return
	}
	if err := s.store.UpdateWord(r.Context(), word); err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toWordJSON(word))
}

func (s *Server) deleteWord(w http.ResponseWriter, r *http.Request) {
	err := s.store.DeleteWord(r.Context(), currentUser(r).ID, r.PathValue("id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "word_not_found", "Слово не найдено")
		return
	}
	if err != nil {
		internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type dedupeResponse struct {
	DuplicatesCount  int `json:"duplicatesCount"`
	UniqueWordsCount int `json:"uniqueWordsCount"`
}

// dedupeWords удаляет повторы в словаре; из одинаковых остаётся самое новое слово.
func (s *Server) dedupeWords(w http.ResponseWriter, r *http.Request) {
	user := currentUser(r)
	words, err := s.store.ListWords(r.Context(), user.ID) // новые первыми
	if err != nil {
		internalError(w, r, err)
		return
	}
	idx := dedupe.NewIndex(nil)
	var dups []string
	for _, word := range words {
		v := dedupeValues(word)
		if idx.Has(v) {
			dups = append(dups, word.ID)
			continue
		}
		idx.Add(v)
	}
	if err := s.store.DeleteWords(r.Context(), user.ID, dups); err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, dedupeResponse{DuplicatesCount: len(dups), UniqueWordsCount: len(words) - len(dups)})
}
