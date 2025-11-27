# CardLesson - Приложение для изучения корейского языка

Веб-приложение для самостоятельного изучения и повторения корейских слов с персональными словарями.

## 🎯 Основные возможности

- ✅ **Регистрация и авторизация** - персональные учетные записи
- ✅ **Валидация данных** - проверка email и пароля
- ✅ **Персональные словари** - каждый пользователь имеет свой набор слов
- ✅ **Мультиязычность** - поддержка русского, английского и корейского языков
- ✅ **Офлайн работа** - все данные хранятся локально в браузере
- ✅ **Синхронизация** - автоматическая синхронизация с сервером

## 🚀 Быстрый старт

### Установка зависимостей:
```bash
yarn install
```

### Запуск dev-сервера:
```bash
yarn dev
```

### Сборка для production:
```bash
yarn build
```

### Проверка линтера:
```bash
yarn lint
```

## 📖 Документация

- [RELEASE_NOTES.md](./RELEASE_NOTES.md) - описание последних изменений
- [AUTH_CHANGES.md](./AUTH_CHANGES.md) - технические детали системы авторизации
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - примеры использования
- [src/hooks/README.md](./src/hooks/README.md) - документация по хукам
- [src/utils/README.md](./src/utils/README.md) - документация по утилитам

## 🏗️ Структура проекта

```
src/
├── components/       # React компоненты
├── hooks/           # Переиспользуемые хуки
│   ├── useAuth.ts
│   ├── useWords.ts
│   └── useWordActions.ts
├── pages/           # Страницы приложения
│   ├── LoginPage/
│   ├── MainPage/
│   └── DictionaryPage/
├── utils/           # Утилиты и вспомогательные функции
│   ├── validation.ts
│   ├── userStorage.ts
│   ├── localAuth.ts
│   ├── wordsCache.ts
│   └── wordsSync.ts
└── App.tsx          # Главный компонент
```

## 🔐 Система авторизации

### Регистрация:
1. Email валидация (формат)
2. Пароль минимум 6 символов
3. Проверка на существование пользователя
4. Создание уникального userId

### Авторизация:
1. Проверка учетных данных
2. Установка текущей сессии
3. Загрузка персональных данных

### Хранилище данных (localStorage):
- `local_user` - текущий пользователь
- `registered_users` - все пользователи
- `words_cache_{userId}` - словарь пользователя

## 🛠️ Технологии

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
