package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

// Settings — языковые настройки профиля.
type Settings struct {
	AppLanguage       string
	FrontCardLanguage *string // nil — сторона карточки выбирается случайно
	SelectedLanguages []string
	BackupReminder    bool  // напоминать раз в неделю скачать копию слов
	UpdatedAt         int64 // 0 — пользователь ещё не сохранял настройки
}

// GetSettings — сохранённые настройки; если их нет, ErrNotFound.
func (s *Store) GetSettings(ctx context.Context, userID string) (Settings, error) {
	var (
		st    Settings
		front sql.NullString
		langs string
	)
	err := s.db.QueryRowContext(ctx,
		"SELECT app_language, front_card_language, selected_languages, backup_reminder, updated_at FROM settings WHERE user_id = ?", userID).
		Scan(&st.AppLanguage, &front, &langs, &st.BackupReminder, &st.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Settings{}, ErrNotFound
	}
	if err != nil {
		return Settings{}, err
	}
	if front.Valid {
		st.FrontCardLanguage = &front.String
	}
	if err := json.Unmarshal([]byte(langs), &st.SelectedLanguages); err != nil {
		return Settings{}, err
	}
	return st, nil
}

func (s *Store) SaveSettings(ctx context.Context, userID string, st Settings) (Settings, error) {
	langs, err := json.Marshal(st.SelectedLanguages)
	if err != nil {
		return Settings{}, err
	}
	st.UpdatedAt = nowMs()
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO settings (user_id, app_language, front_card_language, selected_languages, backup_reminder, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			app_language = excluded.app_language,
			front_card_language = excluded.front_card_language,
			selected_languages = excluded.selected_languages,
			backup_reminder = excluded.backup_reminder,
			updated_at = excluded.updated_at`,
		userID, st.AppLanguage, st.FrontCardLanguage, string(langs), st.BackupReminder, st.UpdatedAt)
	return st, err
}
