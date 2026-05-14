import { ERROR_MESSAGES } from '../../../shared/constants/errors';
import type { Word, WordInput } from '../../../shared/types/word';
import { isDuplicateWord } from '../../../shared/utils/wordsDuplicatesCheck';
import { requireUserId } from '../shared/auth/localAuth';
import {
  createStoredWord,
  getStoredWords,
  saveStoredWords,
  updateStoredWord,
} from '../shared/storage/wordsStorage';

const getWordsFromStorage = async (): Promise<Word[]> => {
  try {
    const userId = await requireUserId();
    const words = await getStoredWords(userId);
    return words;
  } catch (error) {
    if (error instanceof Error && error.message === ERROR_MESSAGES.USER_NOT_AUTHENTICATED) {
      throw error;
    }
    return [];
  }
};

export const fetchWords = async (): Promise<Word[]> => {
  const words = await getWordsFromStorage();
  return words;
};

export const addWord = async (wordData: WordInput): Promise<Word> => {
  const words = await getWordsFromStorage();

  const newWordForCheck: Word = {
    id: '',
    ...wordData,
  };

  if (isDuplicateWord(newWordForCheck, words)) {
    throw new Error(ERROR_MESSAGES.DUPLICATE_WORD);
  }

  const newWord = createStoredWord(wordData);
  const updatedWords = [newWord, ...words];
  const userId = await requireUserId();
  await saveStoredWords(userId, updatedWords);
  return newWord;
};

export const updateWord = async (wordId: string, wordData: Partial<Word>): Promise<Word> => {
  const words = await getWordsFromStorage();
  const wordIndex = words.findIndex((word) => word.id === wordId);

  if (wordIndex === -1) {
    throw new Error(ERROR_MESSAGES.WORD_NOT_FOUND);
  }

  const currentWord = words[wordIndex];
  const nextWord = updateStoredWord(currentWord, {
    ru: wordData.ru ?? currentWord.ru,
    en: wordData.en ?? currentWord.en,
    ko: wordData.ko ?? currentWord.ko,
    translations: {
      ru: wordData.translations?.ru ?? currentWord.translations.ru,
      en: wordData.translations?.en ?? currentWord.translations.en,
      ko: wordData.translations?.ko ?? currentWord.translations.ko,
    },
  });
  const updatedWords = words.map((word) => (word.id === wordId ? nextWord : word));

  const userId = await requireUserId();
  await saveStoredWords(userId, updatedWords);
  return nextWord;
};

export const deleteWord = async (wordId: string): Promise<void> => {
  const words = await getWordsFromStorage();
  const updatedWords = words.filter((word) => word.id !== wordId);
  const userId = await requireUserId();
  await saveStoredWords(userId, updatedWords);
};
