import { ApiError, apiRequest } from '../api/client';
import { getUserId } from '../api/session';

export interface TimerRecord {
  minutes: number;
  wordsCompleted: number;
  date: number;
}

const MAX_RECORDS_PER_DURATION = 5;

// Без связи рекорды не теряются: копятся в очереди в браузере и уходят на сервер,
// как только он снова доступен. Последний ответ сервера тоже хранится — для показа офлайн.
const pendingKey = (userId: string): string => `timer_records_pending_${userId}`;
const cacheKey = (userId: string): string => `timer_records_cache_${userId}`;

const isNetworkError = (error: unknown): boolean => error instanceof ApiError && error.status === 0;

const readList = (key: string): TimerRecord[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TimerRecord[]) : [];
  } catch {
    return [];
  }
};

const writeList = (key: string, list: TimerRecord[]): void => {
  try {
    if (list.length > 0) {
      localStorage.setItem(key, JSON.stringify(list));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // без localStorage просто не запоминаем
  }
};

const groupByMinutes = (records: TimerRecord[]): Record<number, TimerRecord[]> => {
  const result: Record<number, TimerRecord[]> = {};
  for (const record of records) {
    (result[record.minutes] ??= []).push(record);
  }
  for (const minutes of Object.keys(result)) {
    result[Number(minutes)] = result[Number(minutes)]
      .sort((a, b) => b.date - a.date)
      .slice(0, MAX_RECORDS_PER_DURATION);
  }
  return result;
};

// Сервер хранит по 5 последних результатов на каждую длительность таймера.
export const getTimerRecords = async (): Promise<Record<number, TimerRecord[]>> => {
  const userId = getUserId();
  if (!userId) {
    return {};
  }
  let fromServer: TimerRecord[];
  try {
    const data = await apiRequest<Record<string, TimerRecord[]>>('GET', '/api/timer-records');
    fromServer = Object.values(data ?? {}).flat();
    writeList(cacheKey(userId), fromServer);
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }
    fromServer = readList(cacheKey(userId));
  }
  return groupByMinutes([...fromServer, ...readList(pendingKey(userId))]);
};

// flushPendingTimerRecords отправляет рекорды, набранные без сети.
export const flushPendingTimerRecords = async (): Promise<void> => {
  const userId = getUserId();
  if (!userId) {
    return;
  }
  const left: TimerRecord[] = [];
  for (const record of readList(pendingKey(userId))) {
    try {
      await apiRequest<void>('POST', '/api/timer-records', record);
    } catch (error) {
      if (isNetworkError(error)) {
        left.push(record); // сервер отверг запись — повторять бессмысленно, сеть — повторим
      }
    }
  }
  writeList(pendingKey(userId), left);
};

// saveTimerRecord не ждёт ответа: таймер не должен зависать из-за сети.
export const saveTimerRecord = (minutes: number, wordsCompleted: number): void => {
  const userId = getUserId();
  if (!userId) {
    return;
  }
  const record: TimerRecord = { minutes, wordsCompleted, date: Date.now() };
  apiRequest<void>('POST', '/api/timer-records', record).catch((error) => {
    if (isNetworkError(error)) {
      writeList(pendingKey(userId), [...readList(pendingKey(userId)), record]);
      return;
    }
    console.error('Не удалось сохранить рекорд:', error);
  });
};

export const clearTimerRecords = async (): Promise<void> => {
  const userId = getUserId();
  if (!userId) {
    return;
  }
  await apiRequest<void>('DELETE', '/api/timer-records');
  writeList(pendingKey(userId), []);
  writeList(cacheKey(userId), []);
};

// hasPendingTimerRecords — есть ли рекорды, ещё не отправленные на сервер.
export const hasPendingTimerRecords = (): boolean => {
  const userId = getUserId();
  return Boolean(userId) && readList(pendingKey(userId as string)).length > 0;
};
