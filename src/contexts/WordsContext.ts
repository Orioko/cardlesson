import { createContext } from 'react';
import type { Word } from '../types/word';

interface WordsContextValue {
  words: Word[];
  loading: boolean;
  refreshWords: () => void;
}

export const WordsContext = createContext<WordsContextValue | undefined>(undefined);
