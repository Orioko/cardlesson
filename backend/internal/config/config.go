// Package config — настройки сервера из переменных окружения.
package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Addr           string        // адрес HTTP-сервера, например ":8080"
	DBPath         string        // файл SQLite
	AllowedOrigins []string      // откуда браузеру можно ходить в API (CORS)
	TrustProxy     bool          // сервер за Caddy: IP клиента брать из X-Forwarded-For
	SessionTTL     time.Duration // сколько живёт вход
	BackupDir      string        // куда класть ежедневные копии базы
	BackupKeep     int           // сколько последних копий хранить; 0 — автобэкап выключен
}

func Load() (Config, error) {
	cfg := Config{
		Addr:   env("CARDLESSON_ADDR", ":8080"),
		DBPath: env("CARDLESSON_DB", "./data/cardlesson.db"),
		// по умолчанию — локальная разработка: vite dev, vite preview и Expo web
		AllowedOrigins: splitList(env("CARDLESSON_ALLOWED_ORIGINS",
			"http://localhost:5173,http://localhost:4173,http://localhost:8081")),
		TrustProxy: os.Getenv("CARDLESSON_TRUST_PROXY") == "1",
	}
	days, err := strconv.Atoi(env("CARDLESSON_SESSION_DAYS", "90"))
	if err != nil || days < 1 {
		return Config{}, fmt.Errorf("CARDLESSON_SESSION_DAYS: нужно целое число дней больше 0")
	}
	cfg.SessionTTL = time.Duration(days) * 24 * time.Hour
	cfg.BackupDir = env("CARDLESSON_BACKUP_DIR", filepath.Join(filepath.Dir(cfg.DBPath), "backups"))
	cfg.BackupKeep, err = strconv.Atoi(env("CARDLESSON_BACKUP_KEEP", "14"))
	if err != nil || cfg.BackupKeep < 0 {
		return Config{}, fmt.Errorf("CARDLESSON_BACKUP_KEEP: нужно целое число от 0 (0 — без автобэкапа)")
	}
	for _, o := range cfg.AllowedOrigins {
		if !strings.HasPrefix(o, "http://") && !strings.HasPrefix(o, "https://") {
			return Config{}, fmt.Errorf("CARDLESSON_ALLOWED_ORIGINS: %q — нужен адрес вида https://orioko.github.io без пути", o)
		}
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func splitList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if p := strings.TrimRight(strings.TrimSpace(part), "/"); p != "" {
			out = append(out, p)
		}
	}
	return out
}
