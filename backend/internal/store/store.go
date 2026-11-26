// Package store — всё хранение CardLesson в одном файле SQLite.
package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite" // драйвер SQLite на чистом Go: сборка без CGO
)

// ErrNotFound — записи нет или она принадлежит другому пользователю.
var ErrNotFound = errors.New("not found")

// ErrConflict — нарушена уникальность (логин уже занят).
var ErrConflict = errors.New("conflict")

type Store struct {
	db *sql.DB
}

// Open открывает базу (создаёт папку и файл при первом запуске) и применяет миграции.
func Open(path string) (*Store, error) {
	if dir := filepath.Dir(path); dir != "" {
		if err := os.MkdirAll(dir, 0o750); err != nil {
			return nil, fmt.Errorf("папка базы: %w", err)
		}
	}
	dsn := "file:" + path +
		"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_pragma=synchronous(NORMAL)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// Одно соединение: записи в SQLite и так идут по одной, зато без SQLITE_BUSY в транзакциях.
	db.SetMaxOpenConns(1)
	s := &Store{db: db}
	if err := s.migrate(context.Background()); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

// Backup пишет целостную копию базы в файл (файла ещё не должно быть).
func (s *Store) Backup(ctx context.Context, dest string) error {
	_, err := s.db.ExecContext(ctx, "VACUUM INTO ?", dest)
	return err
}

// Миграции по порядку; номер применённой хранится в PRAGMA user_version.
var migrations = []string{
	`
CREATE TABLE users (
	id            TEXT PRIMARY KEY,
	login         TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at    INTEGER NOT NULL
);
CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE words (
	id         TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	ru         TEXT NOT NULL DEFAULT '',
	en         TEXT NOT NULL DEFAULT '',
	ko         TEXT NOT NULL DEFAULT '',
	tr_ru      TEXT NOT NULL DEFAULT '',
	tr_en      TEXT NOT NULL DEFAULT '',
	tr_ko      TEXT NOT NULL DEFAULT '',
	created_at INTEGER NOT NULL
);
CREATE INDEX words_user_created ON words(user_id, created_at DESC);
CREATE TABLE settings (
	user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	app_language        TEXT NOT NULL,
	front_card_language TEXT,
	selected_languages  TEXT NOT NULL,
	updated_at          INTEGER NOT NULL
);
CREATE TABLE timer_records (
	id              INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	minutes         INTEGER NOT NULL,
	words_completed INTEGER NOT NULL,
	date            INTEGER NOT NULL
);
CREATE INDEX timer_records_user ON timer_records(user_id, minutes, date DESC);
`,
	// напоминание раз в неделю скачать резервную копию слов (настройка веб-версии)
	`ALTER TABLE settings ADD COLUMN backup_reminder INTEGER NOT NULL DEFAULT 0;`,
}

func (s *Store) migrate(ctx context.Context) error {
	var version int
	if err := s.db.QueryRowContext(ctx, "PRAGMA user_version").Scan(&version); err != nil {
		return err
	}
	for i := version; i < len(migrations); i++ {
		tx, err := s.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, migrations[i]); err != nil {
			tx.Rollback()
			return fmt.Errorf("миграция %d: %w", i+1, err)
		}
		if _, err := tx.ExecContext(ctx, fmt.Sprintf("PRAGMA user_version = %d", i+1)); err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func newID(prefix string) string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		panic(err) // crypto/rand не падает на поддерживаемых ОС
	}
	return prefix + hex.EncodeToString(b)
}

func nowMs() int64 { return time.Now().UnixMilli() }
