import type { Word } from '../../../../shared/types/word';
import { importWords } from '../../api/wordsApi';
import { apiRequest } from '../api/client';
import type { LocalUser } from '../api/session';
import { getStorageItem, setStorageItem } from './asyncStorage';
import { getLegacyUsers } from './userStorage';

// До появления сервера профили, слова и рекорды жили только в AsyncStorage.
// При первом входе с тем же email всё это переносится на сервер.
// Старые данные не удаляются — остаются запасной копией.
const MIGRATED_KEY_PREFIX = 'cardlesson_legacy_migrated_';

interface LegacyRecord {
  minutes?: number;
  wordsCompleted?: number;
  date?: number;
}

export const migrateLegacyData = async (user: LocalUser): Promise<void> => {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return;
  }
  const legacy = (await getLegacyUsers()).find((u) => u.email.trim().toLowerCase() === email);
  if (!legacy || (await getStorageItem<number>(MIGRATED_KEY_PREFIX + legacy.id))) {
    return;
  }

  try {
    const words = (await getStorageItem<Word[]>(`cardlesson_mobile_words_${legacy.id}`)) ?? [];
    if (words.length > 0) {
      await importWords(
        words.map(({ ru, en, ko, translations, createdAt }) => ({
          ru,
          en,
          ko,
          translations,
          createdAt,
        }))
      );
    }

    const records =
      (await getStorageItem<Record<string, LegacyRecord[]>>(
        `cardlesson_mobile_timer_records_${legacy.id}`
      )) ?? {};
    for (const record of Object.values(records).flat()) {
      if (typeof record?.minutes === 'number') {
        await apiRequest<void>('POST', '/api/timer-records', {
          minutes: record.minutes,
          wordsCompleted: record.wordsCompleted ?? 0,
          date: record.date ?? 0,
        });
      }
    }

    await setStorageItem(MIGRATED_KEY_PREFIX + legacy.id, Date.now());
  } catch (error) {
    // перенос повторится при следующем входе; дубли слов сервер пропустит
    console.warn('Failed to move local data to server:', error);
  }
};
