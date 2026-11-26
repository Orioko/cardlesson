import { apiRequest } from '../api/client';
import type { LocalUser } from '../api/session';
import { fetchSettings, saveSettingsToServer } from '../api/settingsApi';
import type { Lang } from '../components/WordCard/types';
import { LANGS } from '../components/WordCard/constants';
import type { TimerRecord } from './timerRecords';
import { getUsersFromStorage } from './userStorage';
import { loadWordsFromCache } from './wordsCache';
import { importWords } from './wordsApi';

// До появления сервера профили, слова, рекорды и настройки жили только в localStorage.
// При первом входе с тем же email на сервер переносится всё, что лежит в этом браузере.
// Старые данные не удаляются — остаются запасной копией.
const MIGRATED_KEY_PREFIX = 'legacy_migrated_';

const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as string[]).includes(value);

const readLegacySettings = (legacyId: string) => {
  const app = localStorage.getItem(`app_language_${legacyId}`);
  const front = localStorage.getItem(`front_card_language_${legacyId}`);
  const langsRaw = localStorage.getItem(`selected_languages_${legacyId}`);
  if (app === null && front === null && langsRaw === null) {
    return null;
  }
  let selected: Lang[] = [...LANGS];
  try {
    const parsed: unknown = langsRaw ? JSON.parse(langsRaw) : null;
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isLang);
      if (valid.length >= 2) {
        selected = valid;
      }
    }
  } catch {
    // битое значение — оставляем все языки
  }
  return {
    appLanguage: isLang(app) ? app : 'en',
    frontCardLanguage: isLang(front) ? front : null,
    selectedLanguages: selected,
  };
};

const readLegacyRecords = (legacyId: string): TimerRecord[] => {
  try {
    const raw = localStorage.getItem(`timer_records_${legacyId}`);
    const parsed = raw ? (JSON.parse(raw) as Record<string, TimerRecord[]>) : {};
    return Object.values(parsed).flat();
  } catch {
    return [];
  }
};

export const migrateLegacyData = async (user: LocalUser): Promise<void> => {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return;
  }
  const legacy = getUsersFromStorage().find((u) => u.email?.trim().toLowerCase() === email);
  if (!legacy || localStorage.getItem(MIGRATED_KEY_PREFIX + legacy.id)) {
    return;
  }

  try {
    const words = loadWordsFromCache(legacy.id) ?? [];
    if (words.length > 0) {
      const result = await importWords(
        words.map(({ ru, en, ko, translations, createdAt }) => ({
          ru,
          en,
          ko,
          translations,
          createdAt,
        }))
      );
      console.info(
        `Перенесено слов на сервер: ${result.addedCount}, уже были: ${result.duplicatesCount}`
      );
    }

    for (const record of readLegacyRecords(legacy.id)) {
      if (record && typeof record.minutes === 'number') {
        await apiRequest<void>('POST', '/api/timer-records', {
          minutes: record.minutes,
          wordsCompleted: record.wordsCompleted ?? 0,
          date: record.date ?? 0,
        });
      }
    }

    const legacySettings = readLegacySettings(legacy.id);
    if (legacySettings) {
      const current = await fetchSettings();
      if (!current.saved) {
        await saveSettingsToServer(legacySettings);
      }
    }

    localStorage.setItem(MIGRATED_KEY_PREFIX + legacy.id, String(Date.now()));
  } catch (error) {
    // перенос повторится при следующем входе; дубли слов сервер пропустит
    console.error('Не удалось перенести данные из браузера на сервер:', error);
  }
};
