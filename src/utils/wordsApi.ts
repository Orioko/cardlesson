import { getUserId } from './localAuth';
import { loadWordsFromCache, saveWordsToCache } from './wordsCache';

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
    createdAt?: string | number | Date;
}

const getWordsFromStorage = (userId: string): WordData[] => {
    try {
        const words = loadWordsFromCache(userId);
        return words || [];
    } catch (error) {
        console.error('Ошибка загрузки слов:', error);
        return [];
    }
};

const saveWordsToStorage = (userId: string, words: WordData[]): void => {
    try {
        saveWordsToCache(userId, words);
    } catch (error) {
        console.error('Ошибка сохранения слов:', error);
    }
};

export const fetchWords = async (): Promise<WordData[]> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    return getWordsFromStorage(userId);
};

export const addWord = async (wordData: Omit<WordData, 'id' | 'userId' | 'createdAt'>): Promise<WordData> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const words = getWordsFromStorage(userId);
    const newWord: WordData = {
        id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...wordData,
        userId,
        createdAt: new Date().toISOString()
    };
    
    words.push(newWord);
    words.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
    });
    
    saveWordsToStorage(userId, words);
    return newWord;
};

export const updateWord = async (wordId: string, wordData: Partial<WordData>): Promise<WordData> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const words = getWordsFromStorage(userId);
    const wordIndex = words.findIndex((w) => w.id === wordId);
    
    if (wordIndex === -1) {
        throw new Error('Word not found');
    }
    
    words[wordIndex] = {
        ...words[wordIndex],
        ...wordData
    };
    
    saveWordsToStorage(userId, words);
    return words[wordIndex];
};

export const deleteWord = async (wordId: string): Promise<void> => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const words = getWordsFromStorage(userId);
    const filteredWords = words.filter((w) => w.id !== wordId);
    
    saveWordsToStorage(userId, filteredWords);
};

