// Сессии входа на устройстве: текущий пользователь и токены всех профилей,
// в которые входили на этом устройстве (для быстрого переключения профиля).
import { ERROR_MESSAGES } from '../../../../shared/constants/errors';
import { getStorageItem, removeStorageItem, setStorageItem } from '../storage/asyncStorage';

export interface LocalUser {
  id: string;
  email?: string;
  name?: string;
}

export interface SavedAccount {
  user: LocalUser;
  token: string;
}

const CURRENT_USER_KEY = 'cardlesson_auth_current_user';
const ACCOUNTS_KEY = 'cardlesson_auth_accounts';

const listeners = new Set<(user: LocalUser | null) => void>();

export const subscribeUserChange = (listener: (user: LocalUser | null) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitUserChange = (user: LocalUser | null): void => {
  listeners.forEach((listener) => listener(user));
};

export const getSavedAccounts = async (): Promise<SavedAccount[]> =>
  (await getStorageItem<SavedAccount[]>(ACCOUNTS_KEY)) ?? [];

// getCurrentUser — пользователь с действующим токеном; вход старой версии без сервера не считается.
export const getCurrentUser = async (): Promise<LocalUser | null> => {
  const user = await getStorageItem<LocalUser>(CURRENT_USER_KEY);
  if (!user) {
    return null;
  }
  const accounts = await getSavedAccounts();
  return accounts.some((a) => a.user.id === user.id) ? user : null;
};

export const getToken = async (): Promise<string | null> => {
  const user = await getStorageItem<LocalUser>(CURRENT_USER_KEY);
  if (!user) {
    return null;
  }
  const accounts = await getSavedAccounts();
  return accounts.find((a) => a.user.id === user.id)?.token ?? null;
};

export const saveAccount = async (user: LocalUser, token: string): Promise<void> => {
  const others = (await getSavedAccounts()).filter((a) => a.user.id !== user.id);
  await setStorageItem(ACCOUNTS_KEY, [...others, { user, token }]);
};

export const removeAccount = async (userId: string): Promise<void> => {
  const accounts = await getSavedAccounts();
  await setStorageItem(
    ACCOUNTS_KEY,
    accounts.filter((a) => a.user.id !== userId)
  );
};

export const setCurrentUser = async (user: LocalUser | null): Promise<void> => {
  if (user) {
    await setStorageItem(CURRENT_USER_KEY, user);
  } else {
    await removeStorageItem(CURRENT_USER_KEY);
  }
};

// expireCurrentSession — сервер ответил 401: токен просрочен или отозван, выходим из профиля.
export const expireCurrentSession = async (): Promise<void> => {
  const user = await getStorageItem<LocalUser>(CURRENT_USER_KEY);
  if (!user) {
    return;
  }
  await removeAccount(user.id);
  await setCurrentUser(null);
  emitUserChange(null);
};

export const getUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id ?? null;
};

// requireUserId — id вошедшего пользователя или ошибка «не авторизован».
// Живёт здесь, а не в localAuth: модули данных (слова, рекорды) импортируют её без цикла
// localAuth → legacyMigration → wordsApi → localAuth.
export const requireUserId = async (): Promise<string> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }
  return userId;
};
