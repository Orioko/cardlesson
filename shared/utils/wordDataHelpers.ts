import type { WordInput } from '../types/word';

export const capitalizeFirstLetter = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
};

export const createWordInput = (data: { ru: string; en: string; ko: string }): WordInput => {
  const ru = capitalizeFirstLetter(data.ru);
  const en = capitalizeFirstLetter(data.en);
  const ko = capitalizeFirstLetter(data.ko);

  return {
    ru,
    en,
    ko,
    translations: {
      ru,
      en,
      ko,
    },
  };
};

export const getTodayWordsCount = (words: { createdAt?: string | number | Date }[]): number => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  return words.reduce((count, word) => {
    if (!word.createdAt) {
      return count;
    }

    const createdDate = new Date(word.createdAt);

    if (Number.isNaN(createdDate.getTime())) {
      return count;
    }

    if (
      createdDate.getFullYear() === todayYear &&
      createdDate.getMonth() === todayMonth &&
      createdDate.getDate() === todayDate
    ) {
      return count + 1;
    }

    return count;
  }, 0);
};
