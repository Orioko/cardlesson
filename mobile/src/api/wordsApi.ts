import { ERROR_MESSAGES } from '../../../shared/constants/errors';
import {
  DuplicateWordError,
  OfflineWords,
  WordNotFoundError,
  type KeyValueStorage,
  type WordsTransport,
} from '../../../shared/sync/offlineWords';
import type { Word, WordInput } from '../../../shared/types/word';
import { ApiError, apiRequest } from '../shared/api/client';
import { requireUserId } from '../shared/api/session';
import { getStorageItem, removeStorageItem, setStorageItem } from '../shared/storage/asyncStorage';

// Словарь работает и без сети: изменения сохраняются на устройстве и уходят на сервер,
// когда появляется связь (см. shared/sync/offlineWords.ts).

const storage: KeyValueStorage = {
  get: getStorageItem,
  set: setStorageItem,
  remove: removeStorageItem,
};

const transport: WordsTransport = {
  list: () => apiRequest<Word[]>('GET', '/api/words'),
  create: (input) => apiRequest<Word>('POST', '/api/words', input),
  update: (id, patch) => apiRequest<Word>('PATCH', `/api/words/${encodeURIComponent(id)}`, patch),
  remove: (id) => apiRequest<void>('DELETE', `/api/words/${encodeURIComponent(id)}`),
};

export const isNetworkError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 0;

const engines = new Map<string, OfflineWords>();

// wordsSync — офлайн-словарь текущего пользователя (у каждого профиля своя очередь).
export const wordsSync = async (): Promise<OfflineWords> => {
  const userId = await requireUserId();
  let engine = engines.get(userId);
  if (!engine) {
    engine = new OfflineWords({
      storage,
      transport,
      isNetworkError,
      cacheKey: `cardlesson_words_cache_${userId}`,
      queueKey: `cardlesson_words_queue_${userId}`,
    });
    engines.set(userId, engine);
  }
  return engine;
};

// Ошибки переводим в те, что экраны уже умеют показывать.
const mapError = (error: unknown): never => {
  if (
    error instanceof DuplicateWordError ||
    (error instanceof ApiError && error.code === 'duplicate_word')
  ) {
    throw new Error(ERROR_MESSAGES.DUPLICATE_WORD);
  }
  if (
    error instanceof WordNotFoundError ||
    (error instanceof ApiError && error.code === 'word_not_found')
  ) {
    throw new Error(ERROR_MESSAGES.WORD_NOT_FOUND);
  }
  throw error;
};

// fetchWords — словарь для экрана: со связью синхронизирует и берёт свежий, без связи — сохранённый.
export const fetchWords = async (): Promise<Word[]> => (await wordsSync()).fetch();

export const addWord = async (wordData: WordInput): Promise<Word> => {
  try {
    const engine = await wordsSync();
    const word = await engine.add(wordData);
    void engine.flush();
    return word;
  } catch (error) {
    return mapError(error);
  }
};

export const updateWord = async (wordId: string, wordData: Partial<Word>): Promise<Word> => {
  try {
    const engine = await wordsSync();
    const word = await engine.update(wordId, wordData);
    void engine.flush();
    return word;
  } catch (error) {
    return mapError(error);
  }
};

export const deleteWord = async (wordId: string): Promise<void> => {
  try {
    const engine = await wordsSync();
    await engine.remove(wordId);
    void engine.flush();
  } catch (error) {
    mapError(error);
  }
};

export interface ImportWordsResponse {
  addedCount: number;
  duplicatesCount: number;
  errorCount: number;
  words: Word[];
}

// Операции над всем словарём выполняет сервер, поэтому им нужна связь.
// Сначала досылаем локальные изменения, чтобы сервер работал с актуальным словарём.
const requireOnlineSync = async (): Promise<OfflineWords> => {
  const engine = await wordsSync();
  if (!(await engine.flush())) {
    throw new ApiError(0, 'network', 'Server is unavailable. Check your internet connection');
  }
  return engine;
};

// importWords добавляет пачку слов одним запросом; дубли сервер пропускает сам.
export const importWords = async (words: Array<Partial<Word>>): Promise<ImportWordsResponse> => {
  const engine = await requireOnlineSync();
  const result = await apiRequest<ImportWordsResponse>('POST', '/api/words/import', { words });
  await engine.fetch();
  return result;
};

export const dedupeWords = async (): Promise<{
  duplicatesCount: number;
  uniqueWordsCount: number;
}> => {
  const engine = await requireOnlineSync();
  const result = await apiRequest<{ duplicatesCount: number; uniqueWordsCount: number }>(
    'POST',
    '/api/words/dedupe'
  );
  await engine.fetch();
  return result;
};
