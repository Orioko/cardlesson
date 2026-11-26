package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
)

type User struct {
	ID           string
	Login        string
	PasswordHash string
	CreatedAt    int64
}

// CreateUser добавляет пользователя; занятый логин — ErrConflict.
func (s *Store) CreateUser(ctx context.Context, login, passwordHash string) (User, error) {
	u := User{ID: newID("user_"), Login: login, PasswordHash: passwordHash, CreatedAt: nowMs()}
	_, err := s.db.ExecContext(ctx,
		"INSERT INTO users (id, login, password_hash, created_at) VALUES (?, ?, ?, ?)",
		u.ID, u.Login, u.PasswordHash, u.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return User{}, ErrConflict
		}
		return User{}, err
	}
	return u, nil
}

func (s *Store) UserByLogin(ctx context.Context, login string) (User, error) {
	return s.scanUser(s.db.QueryRowContext(ctx,
		"SELECT id, login, password_hash, created_at FROM users WHERE login = ?", login))
}

func (s *Store) SetPassword(ctx context.Context, userID, passwordHash string) error {
	res, err := s.db.ExecContext(ctx, "UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, userID)
	if err != nil {
		return err
	}
	return requireOne(res)
}

func (s *Store) scanUser(row *sql.Row) (User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Login, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return u, err
}

// CreateSession сохраняет хеш токена (сам токен в базе не хранится).
func (s *Store) CreateSession(ctx context.Context, tokenHash, userID string, ttl time.Duration) error {
	now := nowMs()
	_, err := s.db.ExecContext(ctx,
		"INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
		tokenHash, userID, now, now+ttl.Milliseconds())
	return err
}

// UserBySession — владелец живой сессии; просроченная или неизвестная — ErrNotFound.
func (s *Store) UserBySession(ctx context.Context, tokenHash string) (User, error) {
	return s.scanUser(s.db.QueryRowContext(ctx, `
		SELECT u.id, u.login, u.password_hash, u.created_at
		FROM sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ? AND s.expires_at > ?`, tokenHash, nowMs()))
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE token_hash = ?", tokenHash)
	return err
}

// DeleteUserSessions закрывает все сессии пользователя (после смены пароля).
func (s *Store) DeleteUserSessions(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE user_id = ?", userID)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) (int64, error) {
	res, err := s.db.ExecContext(ctx, "DELETE FROM sessions WHERE expires_at <= ?", nowMs())
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

func requireOne(res sql.Result) error {
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
