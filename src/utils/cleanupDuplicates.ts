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
