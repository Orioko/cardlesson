import { getUserId } from './localAuth';
import { loadWordsFromCache, saveWordsToCache } from './wordsCache';
import { isDuplicateWord } from './wordsDuplicatesCheck';

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

  const words = getWordsFromStorage(userId);

  const uniqueWords = Array.from(new Map(words.map((word) => [word.id, word])).values());

  if (uniqueWords.length !== words.length) {
    console.warn(`Найдено дубликатов: ${words.length - uniqueWords.length}, выполняется очистка`);
    saveWordsToStorage(userId, uniqueWords);
  }

  return uniqueWords;
};

export const addWord = async (
  wordData: Omit<WordData, 'id' | 'userId' | 'createdAt'>
): Promise<WordData> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const words = getWordsFromStorage(userId);

  const newWordForCheck: WordData = {
    id: '',
    ...wordData,
  };

  if (isDuplicateWord(newWordForCheck, words)) {
    throw new Error('DUPLICATE_WORD');
  }

  const newWord: WordData = {
    id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...wordData,
    userId,
    createdAt: new Date().toISOString(),
  };

  const wordExists = words.some((w) => w.id === newWord.id);
  if (wordExists) {
    console.warn('Слово с таким ID уже существует, генерируется новый ID');
    newWord.id = `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const uniqueWords = Array.from(new Map(words.map((word) => [word.id, word])).values());

  uniqueWords.unshift(newWord);

  saveWordsToStorage(userId, uniqueWords);
  return newWord;
};

export const updateWord = async (
  wordId: string,
  wordData: Partial<WordData>
): Promise<WordData> => {
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
    ...wordData,
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
