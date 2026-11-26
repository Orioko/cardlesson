// Сессии входа в браузере: текущий пользователь и токены всех профилей,
// в которые входили на этом устройстве (для быстрого переключения профиля).

export interface LocalUser {
  id: string;
  email?: string;
  name?: string;
}

export interface SavedAccount {
  user: LocalUser;
  token: string;
}

const CURRENT_USER_KEY = 'auth_current_user';
const ACCOUNTS_KEY = 'auth_accounts';
export const USER_CHANGE_EVENT = 'localAuthChange';

const readJson = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Ошибка сохранения в localStorage (${key}):`, error);
  }
};

export const getSavedAccounts = (): SavedAccount[] => readJson<SavedAccount[]>(ACCOUNTS_KEY) ?? [];

export const getCurrentUser = (): LocalUser | null => {
  const user = readJson<LocalUser>(CURRENT_USER_KEY);
  // Пользователь без токена — остаток старого входа без сервера: считаем, что вход не выполнен.
  if (!user || !getSavedAccounts().some((a) => a.user.id === user.id)) {
    return null;
  }
  return user;
};

export const getUserId = (): string | null => getCurrentUser()?.id ?? null;

export const getToken = (): string | null => {
  const user = readJson<LocalUser>(CURRENT_USER_KEY);
  if (!user) {
    return null;
  }
  return getSavedAccounts().find((a) => a.user.id === user.id)?.token ?? null;
};

export const saveAccount = (user: LocalUser, token: string): void => {
  const others = getSavedAccounts().filter((a) => a.user.id !== user.id);
  writeJson(ACCOUNTS_KEY, [...others, { user, token }]);
};

export const removeAccount = (userId: string): void => {
  writeJson(
    ACCOUNTS_KEY,
    getSavedAccounts().filter((a) => a.user.id !== userId)
  );
};

export const setCurrentUser = (user: LocalUser | null): void => {
  if (user) {
    writeJson(CURRENT_USER_KEY, user);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const dispatchUserChange = (user: LocalUser | null): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: user }));
  }
};

// expireCurrentSession — сервер ответил 401: токен просрочен или отозван, выходим из профиля.
export const expireCurrentSession = (): void => {
  const user = readJson<LocalUser>(CURRENT_USER_KEY);
  if (!user) {
    return;
  }
  removeAccount(user.id);
  setCurrentUser(null);
  dispatchUserChange(null);
};
