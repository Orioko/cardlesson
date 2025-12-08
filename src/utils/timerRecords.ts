import { getUserId } from './localAuth';

export interface TimerRecord {
  minutes: number;
  wordsCompleted: number;
  date: number;
}

const RECORDS_STORAGE_KEY_PREFIX = 'timer_records_';
const MAX_RECORDS_PER_DURATION = 5;

const getRecordsKey = (userId: string): string => {
  return `${RECORDS_STORAGE_KEY_PREFIX}${userId}`;
};

export const getTimerRecords = (): Record<number, TimerRecord[]> => {
  const userId = getUserId();
  if (!userId) {
    return {};
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }

    const recordsKey = getRecordsKey(userId);
    const stored = localStorage.getItem(recordsKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<number, TimerRecord[]>;
      const result: Record<number, TimerRecord[]> = {};
      for (const [minutes, records] of Object.entries(parsed)) {
        const sortedRecords = (records as TimerRecord[])
          .sort((a, b) => b.date - a.date)
          .slice(0, MAX_RECORDS_PER_DURATION);
        result[Number(minutes)] = sortedRecords;
      }
      return result;
    }
  } catch (error) {
    console.error('Ошибка загрузки рекордов:', error);
  }

  return {};
};

export const saveTimerRecord = (minutes: number, wordsCompleted: number): void => {
  const userId = getUserId();
  if (!userId) {
    return;
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const allRecords = getTimerRecords();
    const recordsForDuration = allRecords[minutes] || [];

    const newRecord: TimerRecord = {
      minutes,
      wordsCompleted,
      date: Date.now(),
    };

    recordsForDuration.push(newRecord);
    const sortedRecords = recordsForDuration
      .sort((a, b) => b.date - a.date)
      .slice(0, MAX_RECORDS_PER_DURATION);

    allRecords[minutes] = sortedRecords;

    const recordsKey = getRecordsKey(userId);
    localStorage.setItem(recordsKey, JSON.stringify(allRecords));
  } catch (error) {
    console.error('Ошибка сохранения рекорда:', error);
  }
};

export const clearTimerRecords = (): void => {
  const userId = getUserId();
  if (!userId) {
    return;
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const recordsKey = getRecordsKey(userId);
    localStorage.removeItem(recordsKey);
  } catch (error) {
    console.error('Ошибка очистки рекордов:', error);
  }
};
