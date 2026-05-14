import { ERROR_MESSAGES } from '../constants/errors';
import { getFromLocalStorage, isLocalStorageAvailable, saveToLocalStorage } from './localStorage';
import {
  findUserByEmail,
  findUserById,
  saveUserToStorage,
  verifyUserCredentials,
} from './userStorage';

export interface LocalUser {
  id: string;
  email?: string;
  name?: string;
}

const USER_STORAGE_KEY = 'local_user';
const USER_CHANGE_EVENT = 'localAuthChange';

export const getCurrentUser = (): LocalUser | null => {
  return getFromLocalStorage<LocalUser>(USER_STORAGE_KEY);
};

export const getUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

const dispatchUserChangeEvent = (user: LocalUser | null): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: user }));
  }
};

export const login = (email: string, password: string): Promise<LocalUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        reject(new Error(ERROR_MESSAGES.LOCALSTORAGE_NOT_SUPPORTED));
        return;
      }

      try {
        const userCredentials = verifyUserCredentials(email, password);

        if (!userCredentials) {
          reject(new Error('Неверный email или пароль'));
          return;
        }

        const user: LocalUser = {
          id: userCredentials.id,
          email: userCredentials.email,
          name: userCredentials.email.split('@')[0],
        };

        saveToLocalStorage(USER_STORAGE_KEY, user);
        dispatchUserChangeEvent(user);
        resolve(user);
      } catch (error) {
        console.error('Ошибка входа:', error);
        reject(error instanceof Error ? error : new Error('Ошибка входа'));
      }
    }, 300);
  });
};

export const register = (email: string, password: string): Promise<LocalUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        reject(new Error(ERROR_MESSAGES.LOCALSTORAGE_NOT_SUPPORTED));
        return;
      }

      try {
        const existingUser = findUserByEmail(email);

        if (existingUser) {
          reject(new Error('Пользователь с таким email уже существует'));
          return;
        }

        const newUserCredentials = saveUserToStorage(email, password);

        const user: LocalUser = {
          id: newUserCredentials.id,
          email: newUserCredentials.email,
          name: newUserCredentials.email.split('@')[0],
        };

        saveToLocalStorage(USER_STORAGE_KEY, user);
        dispatchUserChangeEvent(user);
        resolve(user);
      } catch (error) {
        console.error('Ошибка регистрации:', error);
        reject(error instanceof Error ? error : new Error('Ошибка регистрации'));
      }
    }, 300);
  });
};

export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    dispatchUserChangeEvent(null);
  } catch {
    console.error('Ошибка выхода');
  }
};

export const switchToRegisteredUser = (userId: string): LocalUser => {
  if (!isLocalStorageAvailable()) {
    throw new Error(ERROR_MESSAGES.LOCALSTORAGE_NOT_SUPPORTED);
  }

  try {
    const credentials = findUserById(userId);

    if (!credentials) {
      throw new Error('Пользователь не найден');
    }

    const user: LocalUser = {
      id: credentials.id,
      email: credentials.email,
      name: credentials.email.split('@')[0],
    };

    saveToLocalStorage(USER_STORAGE_KEY, user);
    dispatchUserChangeEvent(user);
    return user;
  } catch (error) {
    console.error('Ошибка смены профиля:', error);
    throw error instanceof Error ? error : new Error('Ошибка смены профиля');
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
