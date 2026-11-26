package api

import (
	"errors"
	"net/http"
	"slices"

	"cardlesson/internal/store"
)

var langs = []string{"ru", "en", "ko"}

// settingsJSON — языковые настройки. saved=false — пользователь их ещё не сохранял,
// пришли значения по умолчанию (по этому признаку фронтенд переносит старые настройки из браузера).
type settingsJSON struct {
	AppLanguage       string   `json:"appLanguage"`
	FrontCardLanguage *string  `json:"frontCardLanguage"`
	SelectedLanguages []string `json:"selectedLanguages"`
	BackupReminder    bool     `json:"backupReminder"`
	Saved             bool     `json:"saved"`
}

func defaultSettings() settingsJSON {
	return settingsJSON{AppLanguage: "en", SelectedLanguages: slices.Clone(langs)}
}

func (s *Server) getSettings(w http.ResponseWriter, r *http.Request) {
	st, err := s.store.GetSettings(r.Context(), currentUser(r).ID)
	if errors.Is(err, store.ErrNotFound) {
		writeJSON(w, http.StatusOK, defaultSettings())
		return
	}
	if err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toSettingsJSON(st))
}

func toSettingsJSON(st store.Settings) settingsJSON {
	return settingsJSON{
		AppLanguage:       st.AppLanguage,
		FrontCardLanguage: st.FrontCardLanguage,
		SelectedLanguages: st.SelectedLanguages,
		BackupReminder:    st.BackupReminder,
		Saved:             true,
	}
}

type settingsInput struct {
	AppLanguage       string   `json:"appLanguage"`
	FrontCardLanguage *string  `json:"frontCardLanguage"`
	SelectedLanguages []string `json:"selectedLanguages"`
	// nil — поле не передано (мобильная версия его не знает): остаётся прежнее значение
	BackupReminder *bool `json:"backupReminder"`
}

func (s *Server) putSettings(w http.ResponseWriter, r *http.Request) {
	var in settingsInput
	if !readJSON(w, r, smallBody, &in) {
		return
	}
	if !slices.Contains(langs, in.AppLanguage) {
		writeError(w, http.StatusBadRequest, "invalid_settings", "Недопустимый язык приложения")
		return
	}
	if in.FrontCardLanguage != nil && !slices.Contains(langs, *in.FrontCardLanguage) {
		writeError(w, http.StatusBadRequest, "invalid_settings", "Недопустимый язык лицевой стороны")
		return
	}
	var selected []string
	for _, l := range in.SelectedLanguages {
		if slices.Contains(langs, l) && !slices.Contains(selected, l) {
			selected = append(selected, l)
		}
	}
	if len(selected) < 2 {
		writeError(w, http.StatusBadRequest, "invalid_settings", "Необходимо выбрать минимум 2 языка")
		return
	}
	userID := currentUser(r).ID
	reminder := false
	if in.BackupReminder != nil {
		reminder = *in.BackupReminder
	} else if prev, err := s.store.GetSettings(r.Context(), userID); err == nil {
		reminder = prev.BackupReminder
	} else if !errors.Is(err, store.ErrNotFound) {
		internalError(w, r, err)
		return
	}
	st, err := s.store.SaveSettings(r.Context(), userID, store.Settings{
		AppLanguage:       in.AppLanguage,
		FrontCardLanguage: in.FrontCardLanguage,
		SelectedLanguages: selected,
		BackupReminder:    reminder,
	})
	if err != nil {
		internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toSettingsJSON(st))
}
