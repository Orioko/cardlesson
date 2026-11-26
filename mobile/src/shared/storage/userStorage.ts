import { getStorageItem, setStorageItem } from './asyncStorage';

// Профили старой версии без сервера (ключ registered_users в AsyncStorage).
// Теперь они только читаются — чтобы при первом входе перенести данные на сервер
// (см. legacyMigration.ts). Новые профили создаются на сервере.

interface LegacyUser {
  email: string;
  id: string;
}

const USERS_STORAGE_KEY = 'registered_users';

export const getLegacyUsers = async (): Promise<LegacyUser[]> => {
  const users = await getStorageItem<unknown>(USERS_STORAGE_KEY);
  if (!Array.isArray(users)) {
    return [];
  }
  return users.filter(
    (u): u is LegacyUser => typeof u?.id === 'string' && typeof u?.email === 'string'
  );
};

// scrubLegacyPasswords убирает пароли из профилей старой версии: там они хранились открытым текстом.
// Для переноса данных нужны только id и email.
export const scrubLegacyPasswords = async (): Promise<void> => {
  const users = await getStorageItem<unknown>(USERS_STORAGE_KEY);
  if (!Array.isArray(users) || !users.some((u) => u && typeof u === 'object' && 'password' in u)) {
    return;
  }
  const cleaned = users.map((u) => {
    if (u && typeof u === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = u as Record<string, unknown>;
      return rest;
    }
    return u;
  });
  await setStorageItem(USERS_STORAGE_KEY, cleaned);
};
