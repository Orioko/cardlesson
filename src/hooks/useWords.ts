import { useCallback, useEffect, useState } from 'react';
import { getUserId } from '../utils/localAuth';
import { fetchWords } from '../utils/wordsApi';

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
}

export const useWords = () => {
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
    loadWords();
  }, [loadWords]);

  const refreshWords = useCallback(() => {
    setLoading(true);
    loadWords();
  }, [loadWords]);

  return {
    words,
    loading,
    refreshWords,
  };
};
