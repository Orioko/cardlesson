import { getUserId } from './storage/localAuth';
import {
  getFromLocalStorage,
  removeFromLocalStorage,
  saveToLocalStorage,
} from './storage/localStorage';

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

const sortAndLimitRecords = (records: TimerRecord[]): TimerRecord[] => {
  return records.sort((a, b) => b.date - a.date).slice(0, MAX_RECORDS_PER_DURATION);
};

export const getTimerRecords = (): Record<number, TimerRecord[]> => {
  const userId = getUserId();
  if (!userId) {
    return {};
  }

  const recordsKey = getRecordsKey(userId);
  const parsed = getFromLocalStorage<Record<number, TimerRecord[]>>(recordsKey);

  if (!parsed) {
    return {};
  }

  const result: Record<number, TimerRecord[]> = {};
  for (const [minutes, records] of Object.entries(parsed)) {
    result[Number(minutes)] = sortAndLimitRecords(records as TimerRecord[]);
  }
  return result;
};

export const saveTimerRecord = (minutes: number, wordsCompleted: number): void => {
  const userId = getUserId();
  if (!userId) {
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
  allRecords[minutes] = sortAndLimitRecords(recordsForDuration);

  const recordsKey = getRecordsKey(userId);
  saveToLocalStorage(recordsKey, allRecords);
};

export const clearTimerRecords = (): void => {
  const userId = getUserId();
  if (!userId) {
    return;
  }

  const recordsKey = getRecordsKey(userId);
  removeFromLocalStorage(recordsKey);
};
