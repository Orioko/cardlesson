# Утилиты приложения

## validation.ts

Утилиты для валидации пользовательского ввода.

### validateEmail(email: string): ValidationResult

Проверяет корректность формата email.

**Возвращает:**
```typescript
{
    isValid: boolean;
    error?: string;
}
```

**Примеры:**
```typescript
validateEmail('user@example.com')  // { isValid: true }
validateEmail('invalid-email')     // { isValid: false, error: 'Неверный формат email' }
validateEmail('')                  // { isValid: false, error: 'Введите email' }
```

### validatePassword(password: string): ValidationResult

Проверяет пароль на соответствие минимальным требованиям (минимум 6 символов).

**Примеры:**
```typescript
validatePassword('password123')  // { isValid: true }
validatePassword('12345')        // { isValid: false, error: 'Пароль должен содержать минимум 6 символов' }
validatePassword('')             // { isValid: false, error: 'Введите пароль' }
```

## userStorage.ts

Утилиты для работы с хранилищем зарегистрированных пользователей.

### getUsersFromStorage(): UserCredentials[]

Получает список всех зарегистрированных пользователей из localStorage.

### saveUserToStorage(email: string, password: string): UserCredentials

Сохраняет нового пользователя в localStorage. Генерирует уникальный userId.

### findUserByEmail(email: string): UserCredentials | null

Находит пользователя по email.

### verifyUserCredentials(email: string, password: string): UserCredentials | null

Проверяет учетные данные пользователя. Возвращает данные пользователя при успешной проверке или null при неудаче.

**Пример использования:**
```typescript
// Регистрация
const newUser = saveUserToStorage('user@example.com', 'password123');

// Проверка при входе
const user = verifyUserCredentials('user@example.com', 'password123');
if (user) {
    // Вход успешен
} else {
    // Неверные учетные данные
}
```

## localAuth.ts

Основные функции авторизации.

### getCurrentUser(): LocalUser | null

Получает текущего авторизованного пользователя.

### getUserId(): string | null

Получает ID текущего пользователя.

### login(email: string, password: string): Promise<LocalUser>

Выполняет вход пользователя. Проверяет учетные данные и устанавливает текущего пользователя.

**Возможные ошибки:**
- "localStorage не поддерживается"
- "Неверный email или пароль"

### register(email: string, password: string): Promise<LocalUser>

Регистрирует нового пользователя. Проверяет на существование email и создает новый аккаунт.

**Возможные ошибки:**
- "localStorage не поддерживается"
- "Пользователь с таким email уже существует"

### logout(): Promise<void>

Выполняет выход пользователя из системы.

### onAuthChange(callback: (user: LocalUser | null) => void): () => void

Подписывается на изменения авторизации. Возвращает функцию отписки.

## wordsCache.ts

Утилиты для кэширования слов пользователя в localStorage.

Все функции работают с userId для разделения данных между пользователями:
- `saveWordsToCache(userId, words)` - сохранить слова
- `loadWordsFromCache(userId)` - загрузить слова
- `addWordToCache(userId, word)` - добавить слово
- `updateWordInCache(userId, wordId, wordData)` - обновить слово
- `removeWordFromCache(userId, wordId)` - удалить слово
- `clearWordsCache(userId)` - очистить весь кэш

## wordsSync.ts

Утилиты для синхронизации слов с сервером.

### syncWordsFromServer(userId: string): Promise<WordData[] | null>

Синхронизирует слова с сервером, объединяет локальные и серверные данные.

### shouldSyncFromServer(userId: string): boolean

Проверяет, нужна ли синхронизация (прошло ли достаточно времени).

### initializeWordsSync(userId: string, onSyncComplete?: (words: WordData[]) => void): () => void

Инициализирует автоматическую синхронизацию. Возвращает функцию очистки.

