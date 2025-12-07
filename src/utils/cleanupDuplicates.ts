import { getUserId } from './localAuth';
import { loadWordsFromCache, saveWordsToCache } from './wordsCache';
import { normalizeWord, wordsAreEqual } from './wordsDuplicatesCheck';

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

export interface CheckDuplicatesResult {
  duplicatesCount: number;
  uniqueWordsCount: number;
}

export const checkAndRemoveDuplicates = async (): Promise<CheckDuplicatesResult> => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const words = loadWordsFromCache(userId);
  if (!words || words.length === 0) {
    return { duplicatesCount: 0, uniqueWordsCount: 0 };
  }

  const normalizedWords = words.map((word) => ({
    word,
    normalized: normalizeWord(word),
  }));

  const uniqueWords: WordData[] = [];
  const seenKeys = new Set<string>();

  for (const { word, normalized } of normalizedWords) {
    const normalizedKey = [normalized.ru, normalized.en, normalized.ko]
      .sort()
      .filter((v) => v.length > 0)
      .join('|');

    if (normalizedKey.length === 0) {
      continue;
    }

    if (seenKeys.has(normalizedKey)) {
      continue;
    }

    const isDuplicate = uniqueWords.some((uniqueWord) => {
      const uniqueNormalized = normalizeWord(uniqueWord);
      return wordsAreEqual(normalized, uniqueNormalized);
    });

    if (!isDuplicate) {
      seenKeys.add(normalizedKey);
      uniqueWords.push(word);
    }
  }

  const duplicatesCount = words.length - uniqueWords.length;

  if (duplicatesCount > 0) {
    saveWordsToCache(userId, uniqueWords);
  }

  return {
    duplicatesCount,
    uniqueWordsCount: uniqueWords.length,
  };
};

export const cleanupDuplicates = (): void => {
  const userId = getUserId();
  if (!userId) {
    console.log('Пользователь не авторизован');
    return;
  }

  try {
    const words = loadWordsFromCache(userId);
    if (!words || words.length === 0) {
      console.log('Нет слов для очистки');
      return;
    }

    const uniqueWords = Array.from(
      new Map(words.map((word: WordData) => [word.id, word])).values()
    );

    if (uniqueWords.length !== words.length) {
      console.log(`Удалено дубликатов: ${words.length - uniqueWords.length}`);
      console.log(`Уникальных слов: ${uniqueWords.length}`);
      saveWordsToCache(userId, uniqueWords);
      console.log('Дубликаты успешно удалены!');
    } else {
      console.log('Дубликаты не найдены');
    }
  } catch (error) {
    console.error('Ошибка при очистке дубликатов:', error);
  }
};

if (typeof window !== 'undefined') {
  (window as Window & { cleanupDuplicates?: () => void }).cleanupDuplicates = cleanupDuplicates;
}
