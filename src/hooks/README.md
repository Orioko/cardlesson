# Хуки приложения

## useAuth

Хук для работы с авторизацией и регистрацией пользователей.

### Параметры:
- `onSuccess?: () => void` - коллбэк, вызываемый после успешной авторизации/регистрации

### Возвращаемые значения:
- `loading: boolean` - индикатор загрузки
- `error: string` - текст ошибки
- `handleLogin: (email: string, password: string) => Promise<boolean>` - функция входа
- `handleRegister: (email: string, password: string) => Promise<boolean>` - функция регистрации
- `clearError: () => void` - очистка ошибки

### Пример использования:
```typescript
const { loading, error, handleLogin, handleRegister } = useAuth({
    onSuccess: () => window.location.reload()
});

await handleLogin('user@example.com', 'password123');
```

## useWords

Хук для загрузки и синхронизации слов пользователя.

### Возвращаемые значения:
- `words: WordData[]` - список слов пользователя
- `loading: boolean` - индикатор загрузки
- `refreshWords: () => void` - принудительное обновление списка слов

### Пример использования:
```typescript
const { words, loading, refreshWords } = useWords();

refreshWords();
```

## useWordActions

Хук для операций редактирования и удаления слов.

### Параметры:
- `onWordUpdated?: () => void` - коллбэк после обновления слов

### Возвращаемые значения:
- `editingWord: { id: string; data: WordData } | null` - текущее редактируемое слово
- `deletingWordId: string | null` - ID удаляемого слова
- `handleEdit: (wordId: string, wordData: WordData) => void` - начать редактирование
- `handleDelete: (wordId: string) => void` - начать удаление
- `confirmDelete: (onDeleteSuccess?: (wordId: string) => void) => Promise<void>` - подтвердить удаление
- `cancelDelete: () => void` - отменить удаление
- `clearEditingWord: () => void` - очистить редактируемое слово

### Пример использования:
```typescript
const { 
    editingWord, 
    deletingWordId, 
    handleEdit, 
    handleDelete, 
    confirmDelete 
} = useWordActions({ 
    onWordUpdated: refreshWords 
});

handleEdit(wordId, wordData);

handleDelete(wordId);
await confirmDelete();
```

