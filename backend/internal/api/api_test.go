package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"cardlesson/internal/config"
	"cardlesson/internal/store"
)

const testOrigin = "https://orioko.github.io"

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })
	cfg := config.Config{AllowedOrigins: []string{testOrigin}, SessionTTL: time.Hour}
	srv := httptest.NewServer(New(cfg, st).Handler())
	t.Cleanup(srv.Close)
	return srv
}

// call делает запрос и разбирает JSON-ответ в out (если out не nil).
func call(t *testing.T, srv *httptest.Server, method, path, token string, body any, out any) int {
	t.Helper()
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		rd = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, srv.URL+path, rd)
	if err != nil {
		t.Fatal(err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			t.Fatalf("%s %s: ответ не JSON: %v", method, path, err)
		}
	}
	return resp.StatusCode
}

func registerUser(t *testing.T, srv *httptest.Server, email string) string {
	t.Helper()
	var auth authResponse
	if code := call(t, srv, "POST", "/api/auth/register", "", credentials{email, "secret12"}, &auth); code != http.StatusCreated {
		t.Fatalf("регистрация %s: код %d", email, code)
	}
	return auth.Token
}

func TestAuthFlow(t *testing.T) {
	srv := newTestServer(t)

	var auth authResponse
	if code := call(t, srv, "POST", "/api/auth/register", "", credentials{" Anna@Mail.com ", "secret12"}, &auth); code != http.StatusCreated {
		t.Fatalf("регистрация: код %d", code)
	}
	if auth.User.Email != "anna@mail.com" || auth.User.Name != "anna" || auth.Token == "" {
		t.Fatalf("неожиданный ответ регистрации: %+v", auth)
	}

	var e apiError
	if code := call(t, srv, "POST", "/api/auth/register", "", credentials{"anna@mail.com", "other123"}, &e); code != http.StatusConflict || e.Error != "user_exists" {
		t.Fatalf("повторная регистрация: код %d, %+v", code, e)
	}
	if code := call(t, srv, "POST", "/api/auth/register", "", credentials{"bad login!", "secret12"}, nil); code != http.StatusBadRequest {
		t.Fatalf("плохой логин: код %d", code)
	}
	if code := call(t, srv, "POST", "/api/auth/register", "", credentials{"short@mail.com", "123"}, nil); code != http.StatusBadRequest {
		t.Fatalf("короткий пароль: код %d", code)
	}

	if code := call(t, srv, "POST", "/api/auth/login", "", credentials{"anna@mail.com", "wrong123"}, nil); code != http.StatusUnauthorized {
		t.Fatalf("неверный пароль: код %d", code)
	}
	if code := call(t, srv, "POST", "/api/auth/login", "", credentials{"nobody@mail.com", "secret12"}, nil); code != http.StatusUnauthorized {
		t.Fatalf("нет пользователя: код %d", code)
	}
	var login authResponse
	if code := call(t, srv, "POST", "/api/auth/login", "", credentials{"ANNA@mail.com", "secret12"}, &login); code != http.StatusOK || login.User.ID != auth.User.ID {
		t.Fatalf("вход: код %d, %+v", code, login)
	}

	var me userJSON
	if code := call(t, srv, "GET", "/api/auth/me", login.Token, nil, &me); code != http.StatusOK || me.ID != auth.User.ID {
		t.Fatalf("me: код %d, %+v", code, me)
	}
	if code := call(t, srv, "POST", "/api/auth/logout", login.Token, nil, nil); code != http.StatusNoContent {
		t.Fatalf("выход: код %d", code)
	}
	if code := call(t, srv, "GET", "/api/auth/me", login.Token, nil, nil); code != http.StatusUnauthorized {
		t.Fatalf("токен после выхода: код %d", code)
	}
	// первая сессия от выхода из второй не пострадала
	if code := call(t, srv, "GET", "/api/auth/me", auth.Token, nil, nil); code != http.StatusOK {
		t.Fatalf("первая сессия: код %d", code)
	}
	if code := call(t, srv, "GET", "/api/words", "", nil, nil); code != http.StatusUnauthorized {
		t.Fatalf("без токена: код %d", code)
	}
}

func TestWordsCRUDAndIsolation(t *testing.T) {
	srv := newTestServer(t)
	anna := registerUser(t, srv, "anna@mail.com")
	bob := registerUser(t, srv, "bob")

	var created wordJSON
	in := map[string]any{"ru": "Кот", "en": "Cat", "ko": "", "translations": map[string]string{"ru": "Кот", "en": "Cat", "ko": ""}}
	if code := call(t, srv, "POST", "/api/words", anna, in, &created); code != http.StatusCreated {
		t.Fatalf("создание: код %d", code)
	}
	if created.ID == "" || created.CreatedAt == "" || created.Translations.En != "Cat" {
		t.Fatalf("неожиданное слово: %+v", created)
	}

	// слово, добавленное офлайн, приходит со своей датой; дату из будущего сервер заменяет своей
	var offline wordJSON
	call(t, srv, "POST", "/api/words", anna, map[string]any{"ru": "Дом", "en": "House", "createdAt": "2026-01-02T03:04:05.000Z"}, &offline)
	if offline.CreatedAt != "2026-01-02T03:04:05.000Z" {
		t.Fatalf("дата офлайн-слова не сохранилась: %s", offline.CreatedAt)
	}
	var future wordJSON
	call(t, srv, "POST", "/api/words", anna, map[string]any{"ru": "Лес", "en": "Forest", "createdAt": "2099-01-01T00:00:00.000Z"}, &future)
	if strings.HasPrefix(future.CreatedAt, "2099") {
		t.Fatalf("дата из будущего принята: %s", future.CreatedAt)
	}
	for _, id := range []string{offline.ID, future.ID} {
		call(t, srv, "DELETE", "/api/words/"+id, anna, nil, nil)
	}

	var e apiError
	dup := map[string]any{"ru": "cat", "en": " КОТ "}
	if code := call(t, srv, "POST", "/api/words", anna, dup, &e); code != http.StatusConflict || e.Error != "duplicate_word" {
		t.Fatalf("дубль: код %d, %+v", code, e)
	}
	if code := call(t, srv, "POST", "/api/words", anna, map[string]any{"ru": "Один"}, nil); code != http.StatusBadRequest {
		t.Fatalf("одно поле: код %d", code)
	}
	// у другого пользователя такое же слово — не дубль
	if code := call(t, srv, "POST", "/api/words", bob, dup, nil); code != http.StatusCreated {
		t.Fatalf("слово второго пользователя: код %d", code)
	}

	// чужое слово не видно и не меняется
	if code := call(t, srv, "PATCH", "/api/words/"+created.ID, bob, map[string]any{"ru": "взлом"}, nil); code != http.StatusNotFound {
		t.Fatalf("PATCH чужого: код %d", code)
	}
	if code := call(t, srv, "DELETE", "/api/words/"+created.ID, bob, nil, nil); code != http.StatusNotFound {
		t.Fatalf("DELETE чужого: код %d", code)
	}
	var bobWords []wordJSON
	call(t, srv, "GET", "/api/words", bob, nil, &bobWords)
	if len(bobWords) != 1 {
		t.Fatalf("у bob %d слов, ждали 1", len(bobWords))
	}

	var updated wordJSON
	patch := map[string]any{"ko": "고양이", "translations": map[string]string{"ko": "고양이"}, "id": created.ID, "userId": "чужой"}
	if code := call(t, srv, "PATCH", "/api/words/"+created.ID, anna, patch, &updated); code != http.StatusOK {
		t.Fatalf("PATCH: код %d", code)
	}
	if updated.Ru != "Кот" || updated.Ko != "고양이" || updated.Translations.Ko != "고양이" || updated.UserID == "чужой" {
		t.Fatalf("PATCH изменил не то: %+v", updated)
	}
	if code := call(t, srv, "PATCH", "/api/words/"+created.ID, anna, map[string]any{"en": "", "ko": "", "translations": map[string]string{"en": "", "ko": ""}}, nil); code != http.StatusBadRequest {
		t.Fatalf("PATCH до одного языка: код %d", code)
	}

	if code := call(t, srv, "DELETE", "/api/words/"+created.ID, anna, nil, nil); code != http.StatusNoContent {
		t.Fatalf("DELETE: код %d", code)
	}
	var annaWords []wordJSON
	call(t, srv, "GET", "/api/words", anna, nil, &annaWords)
	if len(annaWords) != 0 {
		t.Fatalf("после удаления осталось %d слов", len(annaWords))
	}
}

func TestImportAndDedupe(t *testing.T) {
	srv := newTestServer(t)
	tok := registerUser(t, srv, "anna@mail.com")
	call(t, srv, "POST", "/api/words", tok, map[string]any{"ru": "Кот", "en": "Cat"}, nil)

	// файл экспорта: с id, userId и createdAt, как его выгружает фронтенд
	req := map[string]any{"words": []map[string]any{
		{"id": "word_1", "userId": "old", "ru": "Собака", "en": "Dog", "createdAt": "2025-01-02T03:04:05.000Z"},
		{"ru": "cat", "en": "кот"},    // дубль слова из базы
		{"ru": "Собака", "en": "dog"}, // дубль внутри файла
		{"ru": "Одно"},                // меньше двух языков
		{"ru": "Дом", "en": "House", "createdAt": 1700000000000},
	}}
	var resp importResponse
	if code := call(t, srv, "POST", "/api/words/import", tok, req, &resp); code != http.StatusOK {
		t.Fatalf("импорт: код %d", code)
	}
	if resp.AddedCount != 2 || resp.DuplicatesCount != 2 || resp.ErrorCount != 1 {
		t.Fatalf("импорт посчитал %+v", resp)
	}
	if resp.Words[0].CreatedAt != "2025-01-02T03:04:05.000Z" || resp.Words[0].ID == "word_1" {
		t.Fatalf("импорт должен сохранить дату и выдать новый id: %+v", resp.Words[0])
	}

	var words []wordJSON
	call(t, srv, "GET", "/api/words", tok, nil, &words)
	if len(words) != 3 || words[0].Ru != "Кот" {
		t.Fatalf("ждали 3 слова, новое первым: %+v", words)
	}

	// дубль, появившийся правкой, убирает dedupe
	call(t, srv, "PATCH", "/api/words/"+words[1].ID, tok, map[string]any{"ru": "кот", "en": "CAT"}, nil)
	var d dedupeResponse
	if code := call(t, srv, "POST", "/api/words/dedupe", tok, nil, &d); code != http.StatusOK || d.DuplicatesCount != 1 || d.UniqueWordsCount != 2 {
		t.Fatalf("dedupe: код %d, %+v", code, d)
	}
}

func TestSettings(t *testing.T) {
	srv := newTestServer(t)
	tok := registerUser(t, srv, "anna@mail.com")

	var st settingsJSON
	call(t, srv, "GET", "/api/settings", tok, nil, &st)
	if st.Saved || st.AppLanguage != "en" || len(st.SelectedLanguages) != 3 || st.FrontCardLanguage != nil {
		t.Fatalf("настройки по умолчанию: %+v", st)
	}

	ko := "ko"
	in := settingsInput{AppLanguage: "ru", FrontCardLanguage: &ko, SelectedLanguages: []string{"ru", "ko", "ko", "xx"}}
	if code := call(t, srv, "PUT", "/api/settings", tok, in, &st); code != http.StatusOK {
		t.Fatalf("PUT: код %d", code)
	}
	call(t, srv, "GET", "/api/settings", tok, nil, &st)
	if !st.Saved || st.AppLanguage != "ru" || *st.FrontCardLanguage != "ko" || len(st.SelectedLanguages) != 2 {
		t.Fatalf("сохранённые настройки: %+v", st)
	}

	// напоминание о бэкапе: включается явно и не сбрасывается запросом без этого поля (мобильная версия)
	on := true
	call(t, srv, "PUT", "/api/settings", tok, settingsInput{AppLanguage: "ru", SelectedLanguages: []string{"ru", "en"}, BackupReminder: &on}, &st)
	if !st.BackupReminder {
		t.Fatalf("напоминание не включилось: %+v", st)
	}
	call(t, srv, "PUT", "/api/settings", tok, map[string]any{"appLanguage": "en", "selectedLanguages": []string{"ru", "en"}}, &st)
	if !st.BackupReminder || st.AppLanguage != "en" {
		t.Fatalf("PUT без backupReminder сбросил напоминание: %+v", st)
	}

	bad := settingsInput{AppLanguage: "ru", SelectedLanguages: []string{"ru"}}
	if code := call(t, srv, "PUT", "/api/settings", tok, bad, nil); code != http.StatusBadRequest {
		t.Fatalf("один язык: код %d", code)
	}
}

func TestTimerRecords(t *testing.T) {
	srv := newTestServer(t)
	tok := registerUser(t, srv, "anna@mail.com")

	for i := 1; i <= 7; i++ {
		rec := map[string]any{"minutes": 3, "wordsCompleted": i, "date": int64(1_700_000_000_000 + i*1000)}
		if code := call(t, srv, "POST", "/api/timer-records", tok, rec, nil); code != http.StatusNoContent {
			t.Fatalf("рекорд %d: код %d", i, code)
		}
	}
	call(t, srv, "POST", "/api/timer-records", tok, map[string]any{"minutes": 1, "wordsCompleted": 9}, nil)
	if code := call(t, srv, "POST", "/api/timer-records", tok, map[string]any{"minutes": 0, "wordsCompleted": 1}, nil); code != http.StatusBadRequest {
		t.Fatalf("0 минут: код %d", code)
	}

	var recs map[string][]timerRecordJSON
	call(t, srv, "GET", "/api/timer-records", tok, nil, &recs)
	if len(recs["3"]) != store.MaxRecordsPerDuration || recs["3"][0].WordsCompleted != 7 || recs["3"][4].WordsCompleted != 3 {
		t.Fatalf("рекорды за 3 минуты: %+v", recs["3"])
	}
	if len(recs["1"]) != 1 {
		t.Fatalf("рекорды за 1 минуту: %+v", recs["1"])
	}

	call(t, srv, "DELETE", "/api/timer-records", tok, nil, nil)
	recs = nil // Decode в непустую карту дописал бы ключи к старым
	call(t, srv, "GET", "/api/timer-records", tok, nil, &recs)
	if len(recs) != 0 {
		t.Fatalf("после очистки: %+v", recs)
	}
}

func TestCORS(t *testing.T) {
	srv := newTestServer(t)
	preflight := func(origin string) *http.Response {
		req, _ := http.NewRequest("OPTIONS", srv.URL+"/api/words", nil)
		req.Header.Set("Origin", origin)
		req.Header.Set("Access-Control-Request-Method", "POST")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		return resp
	}
	ok := preflight(testOrigin)
	if ok.StatusCode != http.StatusNoContent || ok.Header.Get("Access-Control-Allow-Origin") != testOrigin {
		t.Fatalf("разрешённый origin: %d %q", ok.StatusCode, ok.Header.Get("Access-Control-Allow-Origin"))
	}
	if evil := preflight("https://evil.example"); evil.Header.Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("чужому сайту CORS разрешать нельзя")
	}
}

func TestLoginRateLimit(t *testing.T) {
	srv := newTestServer(t)
	limited := false
	for i := 0; i < 15; i++ {
		if call(t, srv, "POST", "/api/auth/login", "", credentials{"x@mail.com", "wrong123"}, nil) == http.StatusTooManyRequests {
			limited = true
			break
		}
	}
	if !limited {
		t.Fatal("после 10 попыток вход должен ограничиваться")
	}
}

func TestRejectsUnknownFieldsAndHugeBody(t *testing.T) {
	srv := newTestServer(t)
	tok := registerUser(t, srv, "anna@mail.com")
	if code := call(t, srv, "PUT", "/api/settings", tok, map[string]any{"appLanguage": "ru", "isAdmin": true}, nil); code != http.StatusBadRequest {
		t.Fatalf("лишнее поле: код %d", code)
	}
	huge := map[string]any{"ru": string(bytes.Repeat([]byte("а"), smallBody)), "en": "x"}
	if code := call(t, srv, "POST", "/api/words", tok, huge, nil); code != http.StatusRequestEntityTooLarge {
		t.Fatalf("огромное тело: код %d", code)
	}
}

func TestLoginLimitPerAccount(t *testing.T) {
	srv := newTestServer(t)
	registerUser(t, srv, "victim@mail.com")
	// разные IP не помогут: лимит по логину общий
	st, _ := store.Open(filepath.Join(t.TempDir(), "x.db"))
	defer st.Close()
	s := New(config.Config{SessionTTL: time.Hour}, st)
	limited := false
	for i := 0; i < 30; i++ {
		if !s.loginLimit.Allow("victim@mail.com") {
			limited = true
			break
		}
	}
	if !limited {
		t.Fatal("после 20 попыток на один логин вход должен ограничиваться")
	}
	if !s.loginLimit.Allow("other@mail.com") {
		t.Fatal("лимит одного логина не должен задевать другие")
	}
}

func TestRateLimiterKeyCap(t *testing.T) {
	l := newRateLimiter(1, time.Hour)
	for i := 0; i < maxLimiterKeys; i++ {
		l.Allow(strconv.Itoa(i))
	}
	if l.Allow("ещё-один") {
		t.Fatal("сверх потолка ключей новые ключи должны получать отказ")
	}
	if len(l.buckets) > maxLimiterKeys {
		t.Fatalf("карта выросла до %d", len(l.buckets))
	}
}
