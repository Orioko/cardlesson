export const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
};

export const getFromLocalStorage = <T>(key: string): T | null => {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error(`Ошибка чтения из localStorage (${key}):`, error);
    return null;
  }
};

export const saveToLocalStorage = <T>(key: string, value: T): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения в localStorage (${key}):`, error);
    return false;
  }
};

export const removeFromLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Ошибка удаления из localStorage (${key}):`, error);
    return false;
  }
};
