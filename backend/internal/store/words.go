package store

import (
	"context"
	"database/sql"
	"errors"
)

// Word — карточка: основные значения и переводы на трёх языках.
type Word struct {
	ID        string
	UserID    string
	Ru        string
	En        string
	Ko        string
	TrRu      string
	TrEn      string
	TrKo      string
	CreatedAt int64 // unix ms
}

const wordColumns = "id, user_id, ru, en, ko, tr_ru, tr_en, tr_ko, created_at"

// ListWords — слова пользователя, новые первыми (как было во фронтенде).
func (s *Store) ListWords(ctx context.Context, userID string) ([]Word, error) {
	rows, err := s.db.QueryContext(ctx,
		"SELECT "+wordColumns+" FROM words WHERE user_id = ? ORDER BY created_at DESC, rowid DESC", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	words := []Word{}
	for rows.Next() {
		var w Word
		if err := rows.Scan(&w.ID, &w.UserID, &w.Ru, &w.En, &w.Ko, &w.TrRu, &w.TrEn, &w.TrKo, &w.CreatedAt); err != nil {
			return nil, err
		}
		words = append(words, w)
	}
	return words, rows.Err()
}

func (s *Store) CountWords(ctx context.Context, userID string) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM words WHERE user_id = ?", userID).Scan(&n)
	return n, err
}

// InsertWords добавляет слова одной транзакцией и проставляет им ID (и время, если не задано).
func (s *Store) InsertWords(ctx context.Context, userID string, words []Word) ([]Word, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	stmt, err := tx.PrepareContext(ctx, "INSERT INTO words ("+wordColumns+") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	now := nowMs()
	out := make([]Word, 0, len(words))
	for _, w := range words {
		w.ID = newID("word_")
		w.UserID = userID
		if w.CreatedAt <= 0 {
			w.CreatedAt = now
		}
		if _, err := stmt.ExecContext(ctx, w.ID, w.UserID, w.Ru, w.En, w.Ko, w.TrRu, w.TrEn, w.TrKo, w.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, tx.Commit()
}

func (s *Store) GetWord(ctx context.Context, userID, id string) (Word, error) {
	var w Word
	err := s.db.QueryRowContext(ctx, "SELECT "+wordColumns+" FROM words WHERE id = ? AND user_id = ?", id, userID).
		Scan(&w.ID, &w.UserID, &w.Ru, &w.En, &w.Ko, &w.TrRu, &w.TrEn, &w.TrKo, &w.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Word{}, ErrNotFound
	}
	return w, err
}

// UpdateWord перезаписывает тексты слова; чужое или удалённое слово — ErrNotFound.
func (s *Store) UpdateWord(ctx context.Context, w Word) error {
	res, err := s.db.ExecContext(ctx,
		"UPDATE words SET ru = ?, en = ?, ko = ?, tr_ru = ?, tr_en = ?, tr_ko = ? WHERE id = ? AND user_id = ?",
		w.Ru, w.En, w.Ko, w.TrRu, w.TrEn, w.TrKo, w.ID, w.UserID)
	if err != nil {
		return err
	}
	return requireOne(res)
}

func (s *Store) DeleteWord(ctx context.Context, userID, id string) error {
	res, err := s.db.ExecContext(ctx, "DELETE FROM words WHERE id = ? AND user_id = ?", id, userID)
	if err != nil {
		return err
	}
	return requireOne(res)
}

// DeleteWords удаляет пачку слов пользователя одной транзакцией.
func (s *Store) DeleteWords(ctx context.Context, userID string, ids []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, id := range ids {
		if _, err := tx.ExecContext(ctx, "DELETE FROM words WHERE id = ? AND user_id = ?", id, userID); err != nil {
			return err
		}
	}
	return tx.Commit()
}
