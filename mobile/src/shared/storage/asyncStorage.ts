import AsyncStorage from '@react-native-async-storage/async-storage';

export const getStorageItem = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setStorageItem = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const removeStorageItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};
