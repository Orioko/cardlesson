interface WordData {
  id: string;
  ru: string;
  en: string;
  ko: string;
  translations: {
    ru: string;
    en: string;
    ko: string;
  };
  tags?: string[];
  userId?: string;
  createdAt?: string | number | Date;
}

const CACHE_KEY_PREFIX = 'words_cache_';
const CACHE_TIMESTAMP_KEY_PREFIX = 'words_cache_timestamp_';

export const getWordsCacheKey = (userId: string): string => {
  return `${CACHE_KEY_PREFIX}${userId}`;
};

export const getWordsCacheTimestampKey = (userId: string): string => {
  return `${CACHE_TIMESTAMP_KEY_PREFIX}${userId}`;
};

export const saveWordsToCache = (userId: string, words: WordData[]): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage не доступен');
      return;
    }
    const cacheKey = getWordsCacheKey(userId);
    const timestampKey = getWordsCacheTimestampKey(userId);
    localStorage.setItem(cacheKey, JSON.stringify(words));
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (error) {
    console.error('Ошибка сохранения кэша:', error);
  }
};

export const loadWordsFromCache = (userId: string): WordData[] | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const cacheKey = getWordsCacheKey(userId);
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as WordData[];
    }
  } catch (error) {
    console.error('Ошибка загрузки кэша:', error);
  }
  return null;
};
export const removeWordFromCache = (userId: string, wordId: string): void => {
  try {
    const cachedWords = loadWordsFromCache(userId) || [];
    const filteredWords = cachedWords.filter((w) => w.id !== wordId);
    saveWordsToCache(userId, filteredWords);
  } catch (error) {
    console.error('Ошибка удаления слова из кэша:', error);
  }
};
