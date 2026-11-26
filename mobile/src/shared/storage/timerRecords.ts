import { ApiError, apiRequest } from '../api/client';
import { getUserId } from '../api/session';
import { getStorageItem, removeStorageItem, setStorageItem } from './asyncStorage';

export interface TimerRecord {
  minutes: number;
  wordsCompleted: number;
  date: number;
}

const TIMER_DURATIONS = [1, 3, 5, 10] as const;
const MAX_RECORDS_PER_DURATION = 5;

// Без связи рекорды не теряются: копятся в очереди на устройстве и уходят на сервер,
// как только он снова доступен. Последний ответ сервера тоже хранится — для показа офлайн.
const pendingKey = (userId: string): string => `cardlesson_timer_pending_${userId}`;
const cacheKey = (userId: string): string => `cardlesson_timer_cache_${userId}`;

const isNetworkError = (error: unknown): boolean => error instanceof ApiError && error.status === 0;

export const getTimerDurations = (): readonly number[] => {
  return TIMER_DURATIONS;
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
  const userId = await getUserId();
  if (!userId) {
    return {};
  }
  const pending = (await getStorageItem<TimerRecord[]>(pendingKey(userId))) ?? [];
  let fromServer: TimerRecord[];
  try {
    const data = await apiRequest<Record<string, TimerRecord[]>>('GET', '/api/timer-records');
    fromServer = Object.values(data ?? {}).flat();
    await setStorageItem(cacheKey(userId), fromServer);
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }
    fromServer = (await getStorageItem<TimerRecord[]>(cacheKey(userId))) ?? [];
  }
  return groupByMinutes([...fromServer, ...pending]);
};

// flushPendingTimerRecords отправляет рекорды, набранные без сети.
export const flushPendingTimerRecords = async (): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    return;
  }
  const pending = (await getStorageItem<TimerRecord[]>(pendingKey(userId))) ?? [];
  const left: TimerRecord[] = [];
  for (const record of pending) {
    try {
      await apiRequest<void>('POST', '/api/timer-records', record);
    } catch (error) {
      if (!isNetworkError(error)) {
        continue; // сервер отверг запись — повторять бессмысленно
      }
      left.push(record);
    }
  }
  if (left.length > 0) {
    await setStorageItem(pendingKey(userId), left);
  } else {
    await removeStorageItem(pendingKey(userId));
  }
};

export const saveTimerRecord = async (minutes: number, wordsCompleted: number): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    return;
  }
  const record: TimerRecord = { minutes, wordsCompleted, date: Date.now() };
  try {
    await apiRequest<void>('POST', '/api/timer-records', record);
  } catch (error) {
    if (isNetworkError(error)) {
      const pending = (await getStorageItem<TimerRecord[]>(pendingKey(userId))) ?? [];
      await setStorageItem(pendingKey(userId), [...pending, record]);
      return;
    }
    // таймер не должен ломаться из-за ошибок сервера
    console.warn('Failed to save timer record:', error);
  }
};

export const clearTimerRecords = async (): Promise<void> => {
  const userId = await getUserId();
  if (!userId) {
    return;
  }
  await apiRequest<void>('DELETE', '/api/timer-records');
  await removeStorageItem(pendingKey(userId));
  await removeStorageItem(cacheKey(userId));
};

// hasPendingTimerRecords — есть ли рекорды, ещё не отправленные на сервер.
export const hasPendingTimerRecords = async (): Promise<boolean> => {
  const userId = await getUserId();
  return (
    Boolean(userId) &&
    ((await getStorageItem<TimerRecord[]>(pendingKey(userId as string))) ?? []).length > 0
  );
};
