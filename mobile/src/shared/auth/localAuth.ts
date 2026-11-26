import { ApiError, apiRequest } from '../api/client';
import {
  emitUserChange,
  getCurrentUser,
  getSavedAccounts,
  getUserId,
  requireUserId,
  removeAccount,
  saveAccount,
  setCurrentUser,
  subscribeUserChange,
  type LocalUser,
} from '../api/session';
import { pullSettingsFromServer } from '../storage/languageSettings';
import { migrateLegacyData } from '../storage/legacyMigration';

export type { LocalUser };
export { getCurrentUser, getUserId, requireUserId };

interface AuthResponse {
  token: string;
  user: LocalUser;
}

// Вход в профиль: токен сохраняется, данные старой версии (без сервера) переносятся на сервер.
const startSession = async ({ token, user }: AuthResponse): Promise<LocalUser> => {
  await saveAccount(user, token);
  await setCurrentUser(user);
  await migrateLegacyData(user);
  await pullSettingsFromServer();
  emitUserChange(user);
  return user;
};

export const login = async (email: string, password: string): Promise<LocalUser> => {
  const resp = await apiRequest<AuthResponse>(
    'POST',
    '/api/auth/login',
    { email, password },
    { auth: false }
  );
  return startSession(resp);
};

export const register = async (email: string, password: string): Promise<LocalUser> => {
  const resp = await apiRequest<AuthResponse>(
    'POST',
    '/api/auth/register',
    { email, password },
    { auth: false }
  );
  return startSession(resp);
};

// logout — «Выйти» (как и раньше): уйти на экран входа, оставив профиль в меню переключения.
export const logout = async (): Promise<void> => {
  await setCurrentUser(null);
  emitUserChange(null);
};

// logoutAll — «Выйти из всех аккаунтов»: закрывает на сервере все сессии этого устройства.
export const logoutAll = async (): Promise<void> => {
  for (const { user, token } of await getSavedAccounts()) {
    try {
      await apiRequest('POST', '/api/auth/logout', undefined, { token });
    } catch {
      // сервер недоступен — токен истечёт сам
    }
    await removeAccount(user.id);
  }
  await setCurrentUser(null);
  emitUserChange(null);
};

// Профили, в которые входили на этом устройстве (для меню переключения).
export const getProfileAccounts = async (): Promise<{ id: string; email: string }[]> =>
  (await getSavedAccounts()).map((a) => ({ id: a.user.id, email: a.user.email ?? a.user.id }));

// switchToRegisteredUser переключает профиль без пароля: токен сохранён с прошлого входа.
// Если токен уже не действует, профиль убирается из списка — в него нужно войти заново.
export const switchToRegisteredUser = async (userId: string): Promise<LocalUser> => {
  const account = (await getSavedAccounts()).find((a) => a.user.id === userId);
  if (!account) {
    throw new Error('User not found');
  }
  try {
    const user = await apiRequest<LocalUser>('GET', '/api/auth/me', undefined, {
      token: account.token,
    });
    await saveAccount(user, account.token);
    await setCurrentUser(user);
    await pullSettingsFromServer();
    emitUserChange(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await removeAccount(userId);
      throw new Error('This profile session has expired, please sign in again');
    }
    throw error;
  }
};

export const onAuthChange = (callback: (user: LocalUser | null) => void): (() => void) => {
  const unsubscribe = subscribeUserChange(callback);

  void getCurrentUser().then((user) => {
    callback(user);
  });

  return unsubscribe;
};
