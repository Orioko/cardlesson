import { ApiError, apiRequest } from '../api/client';
import {
  USER_CHANGE_EVENT,
  dispatchUserChange,
  getCurrentUser,
  getSavedAccounts,
  getUserId,
  removeAccount,
  saveAccount,
  setCurrentUser,
  type LocalUser,
} from '../api/session';
import { applyUserSettingsForCurrentUser } from './applyUserSettings';
import { migrateLegacyData } from './legacyMigration';

export type { LocalUser };
export { getCurrentUser, getUserId };

interface AuthResponse {
  token: string;
  user: LocalUser;
}

const toError = (error: unknown, fallback: string): Error =>
  error instanceof Error ? error : new Error(fallback);

// Вход в профиль: токен сохраняется, данные старой версии (без сервера) переносятся на сервер.
const startSession = async ({ token, user }: AuthResponse): Promise<LocalUser> => {
  saveAccount(user, token);
  setCurrentUser(user);
  await migrateLegacyData(user);
  await applyUserSettingsForCurrentUser();
  dispatchUserChange(user);
  return user;
};

export const login = async (email: string, password: string): Promise<LocalUser> => {
  try {
    const resp = await apiRequest<AuthResponse>(
      'POST',
      '/api/auth/login',
      { email, password },
      { auth: false }
    );
    return await startSession(resp);
  } catch (error) {
    console.error('Ошибка входа:', error);
    throw toError(error, 'Ошибка входа');
  }
};

export const register = async (email: string, password: string): Promise<LocalUser> => {
  try {
    const resp = await apiRequest<AuthResponse>(
      'POST',
      '/api/auth/register',
      { email, password },
      { auth: false }
    );
    return await startSession(resp);
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    throw toError(error, 'Ошибка регистрации');
  }
};

// logout — «Выйти» (как и раньше): уйти на экран входа, оставив профиль в меню переключения,
// чтобы вернуться в него без пароля. Полный выход с отзывом токенов — logoutAll.
export const logout = async (): Promise<void> => {
  setCurrentUser(null);
  dispatchUserChange(null);
};

// logoutAll — «Выйти из всех аккаунтов»: закрывает на сервере все сессии этого устройства.
export const logoutAll = async (): Promise<void> => {
  await Promise.all(
    getSavedAccounts().map(async ({ user, token }) => {
      try {
        await apiRequest('POST', '/api/auth/logout', undefined, { token });
      } catch (error) {
        console.error('Ошибка выхода на сервере:', error);
      }
      removeAccount(user.id);
    })
  );
  setCurrentUser(null);
  dispatchUserChange(null);
};

// Профили, в которые входили на этом устройстве (для меню переключения).
export const getProfileAccounts = (): { id: string; email: string }[] =>
  getSavedAccounts().map((a) => ({ id: a.user.id, email: a.user.email ?? a.user.id }));

// switchToRegisteredUser переключает профиль без пароля: токен сохранён с прошлого входа.
// Если токен уже не действует, профиль убирается из списка — в него нужно войти заново.
export const switchToRegisteredUser = async (userId: string): Promise<LocalUser> => {
  const account = getSavedAccounts().find((a) => a.user.id === userId);
  if (!account) {
    throw new Error('Пользователь не найден');
  }
  try {
    const user = await apiRequest<LocalUser>('GET', '/api/auth/me', undefined, {
      token: account.token,
    });
    saveAccount(user, account.token);
    setCurrentUser(user);
    await applyUserSettingsForCurrentUser();
    dispatchUserChange(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      removeAccount(userId);
      throw new Error('Сессия этого профиля истекла, войдите в него снова');
    }
    console.error('Ошибка смены профиля:', error);
    throw toError(error, 'Ошибка смены профиля');
  }
};

export const onAuthChange = (callback: (user: LocalUser | null) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<LocalUser | null>;
    callback(customEvent.detail);
  };

  window.addEventListener(USER_CHANGE_EVENT, handleChange);

  callback(getCurrentUser());

  return () => {
    window.removeEventListener(USER_CHANGE_EVENT, handleChange);
  };
};
