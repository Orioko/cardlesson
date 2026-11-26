// Package backup — ежедневные копии базы на сервере.
package backup

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"
)

const (
	prefix = "cardlesson-"
	suffix = ".db"
)

// Snapshotter — то, что умеет делать целостную копию базы (store.Store.Backup).
type Snapshotter interface {
	Backup(ctx context.Context, dest string) error
}

// Daily раз в день кладёт копию базы в dir (cardlesson-ГГГГ-ММ-ДД.db) и хранит последние keep штук.
type Daily struct {
	Store Snapshotter
	Dir   string
	Keep  int
	Now   func() time.Time
}

// Run проверяет раз в час, есть ли копия за сегодня, пока ctx не отменён.
func (d *Daily) Run(ctx context.Context) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		if path, err := d.EnsureToday(ctx); err != nil {
			slog.Error("бэкап базы не сделан", "err", err)
		} else if path != "" {
			slog.Info("бэкап базы сохранён", "file", path)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// EnsureToday делает копию за сегодня, если её ещё нет, и удаляет лишние старые.
// Возвращает путь новой копии или "", если копия за сегодня уже была.
func (d *Daily) EnsureToday(ctx context.Context) (string, error) {
	if err := os.MkdirAll(d.Dir, 0o750); err != nil {
		return "", fmt.Errorf("папка бэкапов: %w", err)
	}
	now := time.Now
	if d.Now != nil {
		now = d.Now
	}
	path := filepath.Join(d.Dir, prefix+now().Format("2006-01-02")+suffix)
	if _, err := os.Stat(path); err == nil {
		return "", d.prune()
	}
	// Пишем во временный файл и переименовываем: недописанная копия не выдаст себя за готовую.
	tmp := path + ".tmp"
	os.Remove(tmp)
	if err := d.Store.Backup(ctx, tmp); err != nil {
		os.Remove(tmp)
		return "", err
	}
	if err := os.Rename(tmp, path); err != nil {
		return "", err
	}
	return path, d.prune()
}

func (d *Daily) prune() error {
	entries, err := os.ReadDir(d.Dir)
	if err != nil {
		return err
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasPrefix(e.Name(), prefix) && strings.HasSuffix(e.Name(), suffix) {
			files = append(files, e.Name())
		}
	}
	slices.Sort(files) // дата в имени: по алфавиту = по времени
	for len(files) > d.Keep {
		if err := os.Remove(filepath.Join(d.Dir, files[0])); err != nil {
			return err
		}
		files = files[1:]
	}
	return nil
}
