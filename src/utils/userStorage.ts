// Профили старой версии без сервера (ключ registered_users в localStorage).
// Теперь они только читаются — чтобы при первом входе перенести данные на сервер
// (см. legacyMigration.ts). Новые профили создаются на сервере.

interface LegacyUser {
  email: string;
  id: string;
}

const USERS_STORAGE_KEY = 'registered_users';

export const getUsersFromStorage = (): LegacyUser[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
      const parsed: unknown = JSON.parse(usersData);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (u): u is LegacyUser => typeof u?.id === 'string' && typeof u?.email === 'string'
        );
      }
    }
  } catch (error) {
    console.error('Ошибка чтения старых профилей:', error);
  }

  return [];
};

// scrubLegacyPasswords убирает пароли из профилей старой версии: там они хранились открытым текстом.
// Для переноса данных нужны только id и email.
export const scrubLegacyPasswords = (): void => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw || !raw.includes('"password"')) {
      return;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }
    const cleaned = parsed.map((u) => {
      if (u && typeof u === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = u as Record<string, unknown>;
        return rest;
      }
      return u;
    });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error('Не удалось очистить старые пароли:', error);
  }
};
