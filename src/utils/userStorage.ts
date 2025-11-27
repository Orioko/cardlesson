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
        createdAt: Date.now()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    return newUser;
};

export const findUserByEmail = (email: string): UserCredentials | null => {
    const users = getUsersFromStorage();
    return users.find(u => u.email === email) || null;
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

