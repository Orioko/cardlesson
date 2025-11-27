import { findUserByEmail, saveUserToStorage, verifyUserCredentials } from './userStorage';

interface LocalUser {
    id: string;
    email?: string;
    name?: string;
}

const USER_STORAGE_KEY = 'local_user';
const USER_CHANGE_EVENT = 'localAuthChange';

export const getCurrentUser = (): LocalUser | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    
    try {
        if (!window.localStorage) {
            return null;
        }
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        if (userData) {
            return JSON.parse(userData) as LocalUser;
        }
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        return null;
    }
    
    return null;
};

export const getUserId = (): string | null => {
    const user = getCurrentUser();
    return user?.id || null;
};

export const login = (email: string, password: string): Promise<LocalUser> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!window.localStorage) {
                reject(new Error('localStorage не поддерживается'));
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
                    name: userCredentials.email.split('@')[0]
                };
                
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
                window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: user }));
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
            if (!window.localStorage) {
                reject(new Error('localStorage не поддерживается'));
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
                    name: newUserCredentials.email.split('@')[0]
                };
                
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
                window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: user }));
                resolve(user);
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                reject(error instanceof Error ? error : new Error('Ошибка регистрации'));
            }
        }, 300);
    });
};

export const logout = async (): Promise<void> => {
    if (typeof window === 'undefined') {
        return;
    }
    
    try {
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT, { detail: null }));
    } catch {
        console.error('Ошибка выхода');
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

