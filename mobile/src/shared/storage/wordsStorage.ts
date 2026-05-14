import type { Word, WordInput } from '../../../../shared/types/word';
import { getStorageItem, setStorageItem } from './asyncStorage';

const WORDS_STORAGE_KEY_PREFIX = 'cardlesson_mobile_words_';

const getWordsStorageKey = (userId: string): string => {
  return `${WORDS_STORAGE_KEY_PREFIX}${userId}`;
};

export const getStoredWords = async (userId: string): Promise<Word[]> => {
  const words = await getStorageItem<Word[]>(getWordsStorageKey(userId));
  return words ?? [];
};

export const saveStoredWords = async (userId: string, words: Word[]): Promise<void> => {
  await setStorageItem(getWordsStorageKey(userId), words);
};

export const createStoredWord = (wordInput: WordInput): Word => {
  const id = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  return {
    id,
    ...wordInput,
    createdAt: new Date().toISOString(),
  };
};

export const updateStoredWord = (currentWord: Word, wordInput: WordInput): Word => {
  return {
    ...currentWord,
    ...wordInput,
  };
};
