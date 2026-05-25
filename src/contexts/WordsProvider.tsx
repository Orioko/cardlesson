import React, { useCallback, useEffect, useState } from 'react';
import { applyUserSettingsForCurrentUser } from '../utils/applyUserSettings';
import { fetchWords } from '../utils/wordsApi';
import { getUserId, onAuthChange } from '../utils/localAuth';
import { WordsContext, type WordData } from './WordsContext';

interface WordsProviderProps {
  children: React.ReactNode;
}

export const WordsProvider = ({ children }: WordsProviderProps) => {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadWords = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setWords([]);
      setLoading(false);
      return;
    }

    try {
      const loadedWords = await fetchWords();
      setWords(loadedWords);
    } catch (error) {
      console.error('Ошибка загрузки слов:', error);
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return onAuthChange((user) => {
      if (user) {
        void applyUserSettingsForCurrentUser();
      }
      void loadWords();
    });
  }, [loadWords]);

  const refreshWords = useCallback(() => {
    setLoading(true);
    loadWords();
  }, [loadWords]);

  return (
    <WordsContext.Provider value={{ words, loading, refreshWords }}>
      {children}
    </WordsContext.Provider>
  );
};
