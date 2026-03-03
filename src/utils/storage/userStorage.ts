interface UserCredentials {
  email: string;
  password: string;
  id: string;
  createdAt: number;
}

const USERS_STORAGE_KEY = 'registered_users';

export const getUsersFromStorage = (): UserCredentials[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const usersData = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
      return JSON.parse(usersData) as UserCredentials[];
    }
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
  }

  return [];
};

export const saveUserToStorage = (email: string, password: string): UserCredentials => {
  const users = getUsersFromStorage();

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newUser: UserCredentials = {
    email,
    password,
    id: userId,
    createdAt: Date.now(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  return newUser;
};

export const findUserByEmail = (email: string): UserCredentials | null => {
  const users = getUsersFromStorage();
  return users.find((u) => u.email === email) || null;
};

export const verifyUserCredentials = (email: string, password: string): UserCredentials | null => {
  const user = findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.password !== password) {
    return null;
  }

  return user;
};

const DEFAULT_USER_EMAIL = 'maniblesk@gmail.com';
const DEFAULT_USER_PASSWORD = 'apfl21SME';
const DEFAULT_USER_ID = 'default_user_maniblesk';

export const initializeDefaultUser = (): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const users = getUsersFromStorage();
    const defaultUserIndex = users.findIndex((u) => u.email === DEFAULT_USER_EMAIL);

    if (defaultUserIndex === -1) {
      const defaultUser: UserCredentials = {
        email: DEFAULT_USER_EMAIL,
        password: DEFAULT_USER_PASSWORD,
        id: DEFAULT_USER_ID,
        createdAt: 0,
      };

      users.push(defaultUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      console.log('Дефолтный пользователь создан:', DEFAULT_USER_EMAIL);
    } else {
      const existingUser = users[defaultUserIndex];
      if (existingUser.password !== DEFAULT_USER_PASSWORD) {
        users[defaultUserIndex] = {
          ...existingUser,
          password: DEFAULT_USER_PASSWORD,
        };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log('Пароль дефолтного пользователя восстановлен');
      }
    }
  } catch (error) {
    console.error('Ошибка инициализации дефолтного пользователя:', error);
  }
};
