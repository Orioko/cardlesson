import { LANGS } from '../components/WordCard/constants';
import type { Lang } from '../components/WordCard/types';
import { normalizeAppLanguage } from './languageUtils';
import { getUserScopedStorageKey, migrateSharedLegacySettingsIfNeeded } from './userSettingsScope';

const APP_LANGUAGE_KEY = 'app_language';

export const getAppLanguage = (): Lang => {
  try {
    const storageKey = getUserScopedStorageKey(APP_LANGUAGE_KEY);

    if (!storageKey) {
      return 'en';
    }

    migrateSharedLegacySettingsIfNeeded();

    const stored = localStorage.getItem(storageKey);

    if (stored) {
      return normalizeAppLanguage(stored);
    }
  } catch (error) {
    console.error('Ошибка получения языка приложения:', error);
  }

  return 'en';
};

export const saveAppLanguage = (language: Lang): void => {
  try {
    const storageKey = getUserScopedStorageKey(APP_LANGUAGE_KEY);

    if (!storageKey) {
      return;
    }

    if (!LANGS.includes(language)) {
      throw new Error('Недопустимый язык');
    }

    localStorage.setItem(storageKey, language);
  } catch (error) {
    console.error('Ошибка сохранения языка приложения:', error);
    throw error;
  }
};
