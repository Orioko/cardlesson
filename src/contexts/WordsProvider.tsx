import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onSynced, startBackgroundSync } from '../api/backgroundSync';
import { applyUserSettingsForCurrentUser } from '../utils/applyUserSettings';
import { getUserId, onAuthChange } from '../utils/localAuth';
import { fetchWords } from '../utils/wordsApi';
import { WordsContext, type WordData } from './WordsContext';

interface WordsProviderProps {
  children: React.ReactNode;
}

export const WordsProvider = ({ children }: WordsProviderProps) => {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Номер последнего запроса: ответ на устаревший запрос (например, от прошлого профиля) отбрасывается.
  const requestIdRef = useRef(0);

  // silent — фоновое обновление после изменений: без экрана загрузки, чтобы страницы
  // (таймер, проверка) не сбрасывали свой прогресс. Полная загрузка — только при входе и смене профиля.
  const loadWords = useCallback(async (silent: boolean) => {
    const requestId = ++requestIdRef.current;
    if (!getUserId()) {
      setWords([]);
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    }

    try {
      const loadedWords = await fetchWords();
      if (requestId === requestIdRef.current) {
        setWords(loadedWords);
      }
    } catch (error) {
      console.error('Ошибка загрузки слов:', error);
      // при фоновом обновлении оставляем то, что уже показано
      if (requestId === requestIdRef.current && !silent) {
        setWords([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return onAuthChange((user) => {
      if (user) {
        void applyUserSettingsForCurrentUser();
      }
      void loadWords(false);
    });
  }, [loadWords]);

  const refreshWords = useCallback(() => loadWords(true), [loadWords]);

  // Изменения, сделанные без связи, досылаются в фоне; после этого — свежий словарь с сервера.
  useEffect(() => {
    const stop = startBackgroundSync();
    const offSynced = onSynced(() => void loadWords(true));
    return () => {
      stop();
      offSynced();
    };
  }, [loadWords]);

  return (
    <WordsContext.Provider value={{ words, loading, refreshWords }}>
      {children}
    </WordsContext.Provider>
  );
};
