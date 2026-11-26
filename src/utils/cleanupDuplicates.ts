import { dedupeWords } from './wordsApi';

export interface CheckDuplicatesResult {
  duplicatesCount: number;
  uniqueWordsCount: number;
}

// Повторы ищет и удаляет сервер: из одинаковых слов остаётся самое новое.
export const checkAndRemoveDuplicates = (): Promise<CheckDuplicatesResult> => dedupeWords();
