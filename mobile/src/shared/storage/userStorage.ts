import { BUILTIN_ACCOUNTS } from '../../../../shared/constants/builtinAccounts';
import { getStorageItem, setStorageItem } from './asyncStorage';

interface UserCredentials {
  email: string;
  password: string;
  id: string;
  createdAt: number;
}

const USERS_STORAGE_KEY = 'registered_users';

export const getUsersFromStorage = async (): Promise<UserCredentials[]> => {
  const users = await getStorageItem<UserCredentials[]>(USERS_STORAGE_KEY);
  return users ?? [];
};

export const saveUserToStorage = async (
  email: string,
  password: string
): Promise<UserCredentials> => {
  const users = await getUsersFromStorage();

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const newUser: UserCredentials = {
    email,
    password,
    id: userId,
    createdAt: Date.now(),
  };

  users.push(newUser);
  await setStorageItem(USERS_STORAGE_KEY, users);

  return newUser;
};

export const findUserByEmail = async (email: string): Promise<UserCredentials | null> => {
  const users = await getUsersFromStorage();
  return users.find((user) => user.email === email) ?? null;
};

export const findUserById = async (id: string): Promise<UserCredentials | null> => {
  const users = await getUsersFromStorage();
  return users.find((user) => user.id === id) ?? null;
};

export const verifyUserCredentials = async (
  email: string,
  password: string
): Promise<UserCredentials | null> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.password !== password) {
    return null;
  }

  return user;
};

export const initializeBuiltinUsers = async (): Promise<void> => {
  const users = await getUsersFromStorage();
  let changed = false;

  for (const builtin of BUILTIN_ACCOUNTS) {
    const index = users.findIndex((u) => u.id === builtin.id);

    if (index === -1) {
      const byEmailIndex = users.findIndex((u) => u.email === builtin.email);
      if (byEmailIndex !== -1) {
        users[byEmailIndex] = {
          ...users[byEmailIndex],
          id: builtin.id,
          password: builtin.password,
          email: builtin.email,
        };
      } else {
        users.push({
          email: builtin.email,
          password: builtin.password,
          id: builtin.id,
          createdAt: 0,
        });
      }
      changed = true;
      continue;
    }

    const existing = users[index];
    if (existing.password !== builtin.password || existing.email !== builtin.email) {
      users[index] = {
        ...existing,
        email: builtin.email,
        password: builtin.password,
      };
      changed = true;
    }
  }

  if (changed) {
    await setStorageItem(USERS_STORAGE_KEY, users);
  }
};
