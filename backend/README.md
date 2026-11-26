# CardLesson API

Бэкенд на Go для веб-версии (`../src`) и мобильной (`../mobile`). Хранит профили, словари,
языковые настройки и рекорды таймера в одном файле SQLite.

- Go 1.27, только стандартная библиотека + `modernc.org/sqlite` (без CGO) и `bcrypt`.
- Пароли — bcrypt; вход — случайный токен в заголовке `Authorization: Bearer …`,
  в базе хранится только его SHA-256. Попытки входа ограничены: 10 подряд с одного IP.
- CORS — только для адресов из `CARDLESSON_ALLOWED_ORIGINS`.

## Запуск локально

```powershell
cd backend
go run ./cmd/cardlesson
```

API поднимется на `http://localhost:8080`, база — `backend/data/cardlesson.db`.
Фронтенд по умолчанию ходит именно туда (`VITE_API_URL`, см. `../.env.example`).

Тесты: `go test ./...`

## Переменные окружения

| Переменная | По умолчанию | Что это |
| --- | --- | --- |
| `CARDLESSON_ADDR` | `:8080` | адрес HTTP-сервера |
| `CARDLESSON_DB` | `./data/cardlesson.db` | файл базы |
| `CARDLESSON_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173,http://localhost:8081` | откуда браузеру можно в API |
| `CARDLESSON_TRUST_PROXY` | — | `1` за Caddy: IP клиента из `X-Forwarded-For` |
| `CARDLESSON_SESSION_DAYS` | `90` | сколько живёт вход |
| `CARDLESSON_BACKUP_DIR` | папка базы + `/backups` | куда класть ежедневные копии |
| `CARDLESSON_BACKUP_KEEP` | `14` | сколько последних копий хранить; `0` — автобэкап выключен |

## Команды

```
cardlesson serve                 сервер (по умолчанию)
cardlesson set-password <логин>  новый пароль из stdin, все входы пользователя закрываются
cardlesson backup <файл>         целостная копия базы на живом сервере
cardlesson healthcheck           проверка для Docker
```

## API

Все ответы — JSON. Ошибка: `{"error": "код", "message": "текст"}`.

| Метод и путь | Что делает |
| --- | --- |
| `GET /api/health` | сервер и база живы |
| `POST /api/auth/register` `{email, password}` | регистрация → `{token, user}` |
| `POST /api/auth/login` `{email, password}` | вход → `{token, user}` |
| `POST /api/auth/logout` | закрыть текущую сессию |
| `GET /api/auth/me` | текущий пользователь |
| `GET /api/words` | словарь, новые первыми |
| `POST /api/words` | добавить слово; дубль → `409 duplicate_word` |
| `POST /api/words/import` `{words: [...]}` | пачка слов, дубли пропускаются → `{addedCount, duplicatesCount, errorCount, words}` |
| `POST /api/words/dedupe` | удалить повторы → `{duplicatesCount, uniqueWordsCount}` |
| `PATCH /api/words/{id}` | изменить переданные поля |
| `DELETE /api/words/{id}` | удалить |
| `GET /api/settings` / `PUT /api/settings` | `{appLanguage, frontCardLanguage, selectedLanguages}` |
| `GET /api/timer-records` | `{"1": [...], "3": [...]}` — по 5 последних на длительность |
| `POST /api/timer-records` `{minutes, wordsCompleted}` | сохранить результат |
| `DELETE /api/timer-records` | очистить рекорды |

Логин — email или короткий логин (`[a-zA-Z0-9._-]{2,64}`), хранится в нижнем регистре.

## Безопасность

Что уже сделано:

- **Пароли** хранятся только как bcrypt-хеш; минимум 8 символов при регистрации.
- **Вход** — случайный токен (32 байта) в заголовке `Authorization`; в базе лежит только его SHA-256,
  поэтому утечка базы не даёт войти под чужой сессией. Выход и смена пароля отзывают токены.
- **Перебор паролей**: не больше 10 попыток подряд с одного IP и 20 на один логин с любых адресов.
  Ответ на несуществующий логин приходит так же долго, как на неверный пароль.
- **Изоляция данных**: каждый запрос к словам, настройкам и рекордам фильтруется по владельцу токена;
  чужое слово отдаёт 404. SQL — только параметризованные запросы.
- **Входные данные**: лимиты на размер тела (64 КБ, импорт — 8 МБ), неизвестные поля JSON — ошибка 400,
  не больше 20 000 слов на пользователя.
- **CORS** — только адреса из `CARDLESSON_ALLOWED_ORIGINS`; cookie не используются, поэтому CSRF не страшен.
- **Фронтенд**: в продакшн-сборке есть Content-Security-Policy — чужой скрипт не загрузится,
  а запросы разрешены только к своему сайту и к API из `VITE_API_URL`.
- **Транспорт**: Caddy выдаёт HTTPS и заголовок HSTS; контейнер работает не от root.

Что нужно сделать при деплое:

1. Задать `VITE_API_URL` в GitHub (Variables) до сборки — от него зависят и запросы, и CSP.
2. В настройках GitHub Pages включить **Enforce HTTPS**.
3. Пароль встроенного аккаунта из старой версии лежит в истории публичного репозитория
   (`shared/constants/builtinAccounts.ts`, удалён) — если он где-то используется, смените его.
   После деплоя сразу зарегистрируйте этот email на сервере, чтобы его не занял кто-то другой.
4. Периодически проверять зависимости:

   ```powershell
   yarn audit --groups dependencies
   cd backend; go run golang.org/x/vuln/cmd/govulncheck@latest ./...
   ```

Осознанные компромиссы: токен хранится в `localStorage` (для SPA на другом домене это обычная
схема, от кражи через XSS защищает CSP); регистрация сообщает, что email уже занят.

## Перенос данных из старой версии

Раньше всё лежало только в `localStorage` браузера (и в AsyncStorage телефона).
При первом входе или регистрации с тем же email фронтенд сам переносит на сервер слова,
рекорды и настройки этого профиля с этого устройства (`src/utils/legacyMigration.ts`,
`mobile/src/shared/storage/legacyMigration.ts`). Старые данные остаются на месте как копия.

## Хостинг на домашнем ПК (по будням 10:00–20:00)

Сайт остаётся на GitHub Pages, приложение и сайт работают без сервера: слова, рекорды и
настройки сохраняются на устройстве. Сервер на ПК нужен только для обмена: в часы работы
клиенты отправляют туда накопленные изменения и забирают данные, если на устройстве их нет
(новый браузер, новый телефон). Расписание задано в `shared/constants/serverSchedule.ts`
и в `deploy/windows/cardlesson-pc.env` — менять в обоих местах.

Как клиенты обращаются к серверу (трафик минимальный):

- при запуске, при возврате в приложение или на вкладку, после изменения слова и при появлении сети;
- по таймеру — только если есть неотправленные изменения и сейчас часы работы сервера:
  одна попытка раз в 5 минут. Вне расписания по таймеру запросов нет совсем.

Ограничения: вход и регистрация на новом устройстве возможны только в часы работы сервера;
если ПК выключен в будний день, изменения просто подождут следующего запуска.

### Туннель (HTTPS снаружи)

GitHub Pages открывается по HTTPS, поэтому и API нужен по HTTPS с постоянным адресом.
Порт на роутере открывать не нужно — сервер слушает только `127.0.0.1`, снаружи он доступен через туннель.

- **Tailscale Funnel** (рекомендуется, бесплатно, домен не нужен): постоянный адрес
  `https://<имя-пк>.<tailnet>.ts.net`. Установить Tailscale, войти, в админке включить
  HTTPS-сертификаты и Funnel для этого устройства. Скрипт запуска сам выполнит
  `tailscale funnel --bg 8080`, скрипт остановки — выключит Funnel.
- **Cloudflare Tunnel** (`CARDLESSON_TUNNEL=cloudflared`): нужен свой домен в Cloudflare
  и именованный туннель (`cloudflared tunnel create cardlesson`, маршрут на `http://127.0.0.1:8080`).
  Быстрый туннель `trycloudflare.com` не подходит — его адрес меняется при каждом запуске.

### Установка

```powershell
cd backend\deploy\windows
copy cardlesson-pc.env.example cardlesson-pc.env   # пути к базе, туннель
.\build.ps1                                        # тесты и сборка bin\cardlesson.exe
.\start.ps1 -Force                                 # проверить запуск сейчас
.\register-schedule.ps1                            # задачи планировщика: старт 10:00 и при входе, стоп 20:00
```

Затем адрес туннеля указать клиентам:

- сайт: GitHub → Settings → Secrets and variables → Actions → Variables → `VITE_API_URL`;
- приложение: `EXPO_PUBLIC_API_URL` при сборке EAS (`mobile/eas.json` или `eas env`).

Сервер и клиенты считают «нет связи» не только отсутствие ответа, но и ответы туннеля
без сервера (502/503/504/530): неотправленные изменения при этом не теряются.

Логи и бэкапы лежат рядом с базой (`scheduler.log`, `server.log`, `backups\`): копия базы
делается при первом запуске за день, хранятся последние `CARDLESSON_BACKUP_KEEP`.
Папку с базой стоит держать на диске, который попадает в твоё обычное резервное копирование.
Удалить задачи: `.\register-schedule.ps1 -Unregister`.

## Деплой: VPS + Docker + Caddy

Фронтенд остаётся на GitHub Pages, API — на небольшом VPS (Hetzner CX22 или аналог, ~€4/мес).
GitHub Pages работает по HTTPS, поэтому API тоже должен быть по HTTPS — сертификат получит Caddy.

1. Сервер с Ubuntu, установлен Docker (`curl -fsSL https://get.docker.com | sh`).
2. Домен для API: A-запись `api.<твой-домен>` → IP сервера. Без домена подойдёт
   бесплатный `<IP-через-дефисы>.sslip.io`, например `203-0-113-10.sslip.io`.
3. Скопировать папку `backend` на сервер (например, `git clone` репозитория), затем:

   ```bash
   cd cardlesson/backend/deploy
   cp .env.example .env && chmod 600 .env && nano .env   # домен и CARDLESSON_ALLOWED_ORIGINS
   mkdir -p data && sudo chown 10001 data                  # пользователь из контейнера
   docker compose up -d --build
   curl https://<домен>/api/health                         # {"ok":true}
   ```

4. В GitHub: Settings → Secrets and variables → Actions → Variables → `VITE_API_URL` =
   `https://<домен>`. Следующий пуш в `main` соберёт фронтенд с этим адресом.
5. Мобильная версия: `EXPO_PUBLIC_API_URL=https://<домен>` при сборке EAS
   (в `mobile/eas.json` → `build.production.env` или через `eas env`).
6. Бэкапы. Сервер сам раз в сутки кладёт копию базы в `deploy/data/backups`
   (`cardlesson-ГГГГ-ММ-ДД.db`) и хранит последние 14. Эти копии лежат на том же диске,
   поэтому от поломки самого VPS они не спасут: включи снапшоты у хостера
   (у Hetzner — «Backups», +20% к цене) или забирай файлы к себе, например:

   ```bash
   scp root@<IP>:/root/cardlesson/backend/deploy/data/backups/*.db ./cardlesson-backups/
   ```

   Восстановление: остановить `api`, положить нужную копию на место `data/cardlesson.db`, запустить.
   Кроме этого, в веб-версии можно включить напоминание раз в неделю скачивать словарь файлом
   (Настройки → «Резервная копия слов»); файл загружается обратно кнопкой «Загрузить слова».

Обновление: `git pull && docker compose up -d --build` — миграции базы применятся сами.
