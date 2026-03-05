export interface WordTranslations {
  ru: string;
  en: string;
  ko: string;
}

export interface Word {
  id: string;
  ru: string;
  en: string;
  ko: string;
  translations: WordTranslations;
  userId?: string;
  createdAt?: string | number | Date;
}

export type WordInput = Omit<Word, 'id' | 'userId' | 'createdAt'>;

export type WordUpdate = Partial<Word>;

export type PartialWord = {
  id?: string;
  ru?: string;
  en?: string;
  ko?: string;
  translations?: Partial<WordTranslations>;
  userId?: string;
  createdAt?: string | number | Date;
};
