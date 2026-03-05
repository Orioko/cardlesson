import { ERROR_MESSAGES } from '../../constants/errors';
import type { Word, WordInput } from '../../types/word';
import { getUserId } from '../storage/localAuth';
import { loadWordsFromCache, saveWordsToCache } from './wordsCache';
import { isDuplicateWord } from './wordsDuplicatesCheck';

const getWordsFromStorage = (userId: string): Word[] => {
  try {
    const words = loadWordsFromCache(userId);
    return words || [];
  } catch (error) {
    console.error('Ошибка загрузки слов:', error);
    return [];
  }
};

const saveWordsToStorage = (userId: string, words: Word[]): void => {
  try {
    saveWordsToCache(userId, words);
  } catch (error) {
    console.error('Ошибка сохранения слов:', error);
  }
};

const getUniqueWords = (words: Word[]): Word[] => {
  return Array.from(new Map(words.map((word) => [word.id, word])).values());
};

export const fetchWords = async (): Promise<Word[]> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }

  const words = getWordsFromStorage(userId);
  const uniqueWords = getUniqueWords(words);

  if (uniqueWords.length !== words.length) {
    console.warn(`Найдено дубликатов: ${words.length - uniqueWords.length}, выполняется очистка`);
    saveWordsToStorage(userId, uniqueWords);
  }

  return uniqueWords;
};

export const addWord = async (wordData: WordInput): Promise<Word> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }

  const words = getWordsFromStorage(userId);

  const newWordForCheck: Word = {
    id: '',
    ...wordData,
  };

  if (isDuplicateWord(newWordForCheck, words)) {
    throw new Error(ERROR_MESSAGES.DUPLICATE_WORD);
  }

  const newWord: Word = {
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

  const uniqueWords = getUniqueWords(words);
  uniqueWords.unshift(newWord);

  saveWordsToStorage(userId, uniqueWords);
  return newWord;
};

export const updateWord = async (wordId: string, wordData: Partial<Word>): Promise<Word> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }

  const words = getWordsFromStorage(userId);
  const wordIndex = words.findIndex((w) => w.id === wordId);

  if (wordIndex === -1) {
    throw new Error(ERROR_MESSAGES.WORD_NOT_FOUND);
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
    throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
  }

  const words = getWordsFromStorage(userId);
  const filteredWords = words.filter((w) => w.id !== wordId);

  saveWordsToStorage(userId, filteredWords);
};
