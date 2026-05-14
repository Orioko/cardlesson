import { getStorageItem, removeStorageItem, setStorageItem } from './asyncStorage';
import { getUserId } from '../auth/localAuth';

export interface TimerRecord {
  minutes: number;
  wordsCompleted: number;
  date: number;
}

const TIMER_DURATIONS = [1, 3, 5, 10] as const;
const MAX_RECORDS_PER_DURATION = 5;
const TIMER_RECORDS_STORAGE_KEY_PREFIX = 'cardlesson_mobile_timer_records_';

const getTimerRecordsStorageKey = (userId: string): string => {
  return `${TIMER_RECORDS_STORAGE_KEY_PREFIX}${userId}`;
};

const sortAndLimitRecords = (records: TimerRecord[]): TimerRecord[] => {
  return records.sort((a, b) => b.date - a.date).slice(0, MAX_RECORDS_PER_DURATION);
};

export const getTimerDurations = (): readonly number[] => {
  return TIMER_DURATIONS;
};

export const getTimerRecords = async (): Promise<Record<number, TimerRecord[]>> => {
  const userId = await getUserId();

  if (!userId) {
    return {};
  }

  const parsed = await getStorageItem<Record<number, TimerRecord[]>>(
    getTimerRecordsStorageKey(userId)
  );

  if (!parsed) {
    return {};
  }

  const result: Record<number, TimerRecord[]> = {};
  for (const [minutes, records] of Object.entries(parsed)) {
    result[Number(minutes)] = sortAndLimitRecords(records as TimerRecord[]);
  }

  return result;
};

export const saveTimerRecord = async (minutes: number, wordsCompleted: number): Promise<void> => {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const allRecords = await getTimerRecords();
  const recordsForDuration = allRecords[minutes] || [];

  recordsForDuration.push({
    minutes,
    wordsCompleted,
    date: Date.now(),
  });

  allRecords[minutes] = sortAndLimitRecords(recordsForDuration);
  await setStorageItem(getTimerRecordsStorageKey(userId), allRecords);
};

export const clearTimerRecords = async (): Promise<void> => {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  await removeStorageItem(getTimerRecordsStorageKey(userId));
};
