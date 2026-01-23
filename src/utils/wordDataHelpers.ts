import type { Word, WordInput } from '../types/word';

export const transformToWord = (
  id: string,
  data: {
    ru: string;
    en: string;
    ko: string;
    translations: { ru: string; en: string; ko: string };
  }
): Word => {
  return {
    id,
    ru: data.ru,
    en: data.en,
    ko: data.ko,
    translations: data.translations,
  };
};

export const createWordInput = (data: { ru: string; en: string; ko: string }): WordInput => {
  return {
    ru: data.ru,
    en: data.en,
    ko: data.ko,
    translations: {
      ru: data.ru,
      en: data.en,
      ko: data.ko,
    },
  };
};
