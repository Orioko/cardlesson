package store

import "context"

// MaxRecordsPerDuration — сколько последних результатов хранится для каждой длительности таймера.
const MaxRecordsPerDuration = 5

type TimerRecord struct {
	Minutes        int
	WordsCompleted int
	Date           int64 // unix ms
}

// ListTimerRecords — по последним MaxRecordsPerDuration результатам на каждую длительность, новые первыми.
func (s *Store) ListTimerRecords(ctx context.Context, userID string) ([]TimerRecord, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT minutes, words_completed, date FROM (
			SELECT minutes, words_completed, date,
				ROW_NUMBER() OVER (PARTITION BY minutes ORDER BY date DESC, id DESC) AS rn
			FROM timer_records WHERE user_id = ?
		) WHERE rn <= ? ORDER BY minutes, date DESC`, userID, MaxRecordsPerDuration)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TimerRecord
	for rows.Next() {
		var r TimerRecord
		if err := rows.Scan(&r.Minutes, &r.WordsCompleted, &r.Date); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// AddTimerRecord сохраняет результат и удаляет старые сверх лимита для этой длительности.
func (s *Store) AddTimerRecord(ctx context.Context, userID string, r TimerRecord) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if r.Date <= 0 {
		r.Date = nowMs()
	}
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO timer_records (user_id, minutes, words_completed, date) VALUES (?, ?, ?, ?)",
		userID, r.Minutes, r.WordsCompleted, r.Date); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		DELETE FROM timer_records WHERE user_id = ? AND minutes = ? AND id NOT IN (
			SELECT id FROM timer_records WHERE user_id = ? AND minutes = ?
			ORDER BY date DESC, id DESC LIMIT ?)`,
		userID, r.Minutes, userID, r.Minutes, MaxRecordsPerDuration); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Store) ClearTimerRecords(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM timer_records WHERE user_id = ?", userID)
	return err
}
