import { useContext } from 'react';
import { WordsContext } from '../contexts/WordsContext';

export const useWordsContext = () => {
  const context = useContext(WordsContext);
  if (context === undefined) {
    throw new Error('useWordsContext must be used within a WordsProvider');
  }
  return context;
};
