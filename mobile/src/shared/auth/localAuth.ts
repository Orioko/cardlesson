import { ERROR_MESSAGES } from '../../../../shared/constants/errors';
import { getStorageItem, removeStorageItem, setStorageItem } from '../storage/asyncStorage';
import {
  findUserByEmail,
  findUserById,
  saveUserToStorage,
  verifyUserCredentials,
} from '../storage/userStorage';

export interface LocalUser {
  id: string;
  email?: string;
  name?: string;
}

const USER_STORAGE_KEY = 'local_user';

const listeners = new Set<(user: LocalUser | null) => void>();

const emitUserChange = (user: LocalUser | null): void => {
  listeners.forEach((listener) => {
    listener(user);
  });
};

export const getCurrentUser = async (): Promise<LocalUser | null> => {
  return getStorageItem<LocalUser>(USER_STORAGE_KEY);
};

export const getUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id ?? null;
};

export const login = async (email: string, password: string): Promise<LocalUser> => {
  const userCredentials = await verifyUserCredentials(email, password);

  if (!userCredentials) {
    throw new Error('Invalid email or password');
  }

  const user: LocalUser = {
    id: userCredentials.id,
    email: userCredentials.email,
    name: userCredentials.email.split('@')[0],
  };

  await setStorageItem(USER_STORAGE_KEY, user);
  emitUserChange(user);
  return user;
};

export const register = async (email: string, password: string): Promise<LocalUser> => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const newUserCredentials = await saveUserToStorage(email, password);
  const user: LocalUser = {
    id: newUserCredentials.id,
    email: newUserCredentials.email,
    name: newUserCredentials.email.split('@')[0],
  };

  await setStorageItem(USER_STORAGE_KEY, user);
  emitUserChange(user);
  return user;
};

export const logout = async (): Promise<void> => {
  await removeStorageItem(USER_STORAGE_KEY);
  emitUserChange(null);
};

export const switchToRegisteredUser = async (userId: string): Promise<LocalUser> => {
  const credentials = await findUserById(userId);

  if (!credentials) {
    throw new Error('User not found');
  }

  const user: LocalUser = {
    id: credentials.id,
    email: credentials.email,
    name: credentials.email.split('@')[0],
  };

  await setStorageItem(USER_STORAGE_KEY, user);
  emitUserChange(user);
  return user;
};

export const requireUserId = async (): Promise<string> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }

  return userId;
};

export const onAuthChange = (callback: (user: LocalUser | null) => void): (() => void) => {
  listeners.add(callback);

  void getCurrentUser().then((user) => {
    callback(user);
  });

  return () => {
    listeners.delete(callback);
  };
};
