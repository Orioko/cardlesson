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
    userId?: string;
    createdAt?: unknown;
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

export const addWordToCache = (userId: string, word: WordData): void => {
    try {
        const cachedWords = loadWordsFromCache(userId) || [];
        cachedWords.unshift(word);
        saveWordsToCache(userId, cachedWords);
    } catch (error) {
        console.error('Ошибка добавления слова в кэш:', error);
    }
};

export const updateWordInCache = (userId: string, wordId: string, wordData: Partial<WordData>): void => {
    try {
        const cachedWords = loadWordsFromCache(userId) || [];
        const index = cachedWords.findIndex((w) => w.id === wordId);
        if (index !== -1) {
            cachedWords[index] = { ...cachedWords[index], ...wordData };
            saveWordsToCache(userId, cachedWords);
        }
    } catch (error) {
        console.error('Ошибка обновления слова в кэше:', error);
    }
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

export const clearWordsCache = (userId: string): void => {
    try {
        const cacheKey = getWordsCacheKey(userId);
        const timestampKey = getWordsCacheTimestampKey(userId);
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(timestampKey);
    } catch (error) {
        console.error('Ошибка очистки кэша:', error);
    }
};

