// Сервер CardLesson. Запуск: go run ./cmd/cardlesson (по умолчанию команда serve).
package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"cardlesson/internal/api"
	"cardlesson/internal/backup"
	"cardlesson/internal/config"
	"cardlesson/internal/store"
)

const usage = `Команды cardlesson:
  serve                  запустить сервер (по умолчанию)
  set-password <логин>   задать пользователю новый пароль (читается из stdin) и закрыть его сессии
  backup <файл>          целостная копия базы в файл, можно делать на живом сервере
  healthcheck            проверить, что сервер отвечает (для Docker)`

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	command := "serve"
	if len(args) > 0 {
		command = args[0]
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if command == "healthcheck" {
		return healthcheck(cfg)
	}

	st, err := store.Open(cfg.DBPath)
	if err != nil {
		return fmt.Errorf("база %s: %w", cfg.DBPath, err)
	}
	defer st.Close()

	switch command {
	case "serve":
		return serve(cfg, st)
	case "set-password":
		if len(args) != 2 {
			return errors.New("укажи логин: cardlesson set-password <логин>")
		}
		return setPassword(st, args[1])
	case "backup":
		if len(args) != 2 {
			return errors.New("укажи файл: cardlesson backup /data/backup.db")
		}
		if err := st.Backup(context.Background(), args[1]); err != nil {
			return err
		}
		fmt.Println("Копия базы сохранена в", args[1])
		return nil
	default:
		return fmt.Errorf("неизвестная команда %q\n\n%s", command, usage)
	}
}

func serve(cfg config.Config, st *store.Store) error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	app := api.New(cfg, st)
	go app.RunMaintenance(ctx)
	if cfg.BackupKeep > 0 {
		daily := &backup.Daily{Store: st, Dir: cfg.BackupDir, Keep: cfg.BackupKeep}
		go daily.Run(ctx)
	}

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           app.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	errCh := make(chan error, 1)
	go func() {
		slog.Info("CardLesson API запущен", "addr", cfg.Addr, "db", cfg.DBPath, "origins", cfg.AllowedOrigins)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}
	slog.Info("останавливаюсь")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

func setPassword(st *store.Store, login string) error {
	ctx := context.Background()
	user, err := st.UserByLogin(ctx, api.NormalizeLogin(login))
	if errors.Is(err, store.ErrNotFound) {
		return fmt.Errorf("пользователь %q не найден", login)
	}
	if err != nil {
		return err
	}
	fmt.Fprint(os.Stderr, "Новый пароль: ")
	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil && line == "" {
		return errors.New("пароль не введён")
	}
	password := strings.TrimRight(line, "\r\n")
	if msg := api.ValidatePassword(password); msg != "" {
		return errors.New(msg)
	}
	hash, err := api.HashPassword(password)
	if err != nil {
		return err
	}
	if err := st.SetPassword(ctx, user.ID, hash); err != nil {
		return err
	}
	if err := st.DeleteUserSessions(ctx, user.ID); err != nil {
		return err
	}
	fmt.Println("Пароль изменён, все входы пользователя закрыты.")
	return nil
}

func healthcheck(cfg config.Config) error {
	addr := cfg.Addr
	if strings.HasPrefix(addr, ":") {
		addr = "127.0.0.1" + addr
	}
	client := http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://" + addr + "/api/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health: %s", resp.Status)
	}
	return nil
}
