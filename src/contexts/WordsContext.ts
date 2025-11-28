import { createContext } from 'react';

export interface WordData {
  id: string;
  ru: string;
  en: string;
  ko: string;
  translations: {
    ru: string;
    en: string;
    ko: string;
  };
}

interface WordsContextValue {
  words: WordData[];
  loading: boolean;
  refreshWords: () => void;
}

export const WordsContext = createContext<WordsContextValue | undefined>(undefined);
