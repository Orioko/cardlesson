import { LANGS } from '../components/WordCard/constants';
import type { Lang } from '../components/WordCard/types';
import { getUserScopedStorageKey, migrateSharedLegacySettingsIfNeeded } from './userSettingsScope';

const SELECTED_LANGUAGES_KEY = 'selected_languages';

export const getSelectedLanguages = (): Lang[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return LANGS;
    }

    const storageKey = getUserScopedStorageKey(SELECTED_LANGUAGES_KEY);

    if (!storageKey) {
      return LANGS;
    }

    migrateSharedLegacySettingsIfNeeded();

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Lang[];
      const valid = parsed.filter((lang) => LANGS.includes(lang));
      if (valid.length >= 2) {
        return valid;
      }
    }
  } catch (error) {
    console.error('Ошибка получения выбранных языков:', error);
  }

  return LANGS;
};

export const saveSelectedLanguages = (languages: Lang[]): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const storageKey = getUserScopedStorageKey(SELECTED_LANGUAGES_KEY);

    if (!storageKey) {
      return;
    }

    if (languages.length < 2) {
      throw new Error('Необходимо выбрать минимум 2 языка');
    }

    const valid = languages.filter((lang) => LANGS.includes(lang));
    if (valid.length < 2) {
      throw new Error('Необходимо выбрать минимум 2 языка');
    }

    localStorage.setItem(storageKey, JSON.stringify(valid));
    window.dispatchEvent(new CustomEvent('selectedLanguagesChanged'));
  } catch (error) {
    console.error('Ошибка сохранения выбранных языков:', error);
    throw error;
  }
};
