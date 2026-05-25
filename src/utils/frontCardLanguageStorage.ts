import { LANGS } from '../components/WordCard/constants';
import type { Lang } from '../components/WordCard/types';
import { getUserScopedStorageKey, migrateSharedLegacySettingsIfNeeded } from './userSettingsScope';

const FRONT_CARD_LANGUAGE_KEY = 'front_card_language';

export const getFrontCardLanguage = (): Lang | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const storageKey = getUserScopedStorageKey(FRONT_CARD_LANGUAGE_KEY);

    if (!storageKey) {
      return null;
    }

    migrateSharedLegacySettingsIfNeeded();

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = stored as Lang;
      if (LANGS.includes(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Ошибка получения языка лицевой стороны карточки:', error);
  }

  return null;
};

export const saveFrontCardLanguage = (language: Lang | null): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const storageKey = getUserScopedStorageKey(FRONT_CARD_LANGUAGE_KEY);

    if (!storageKey) {
      return;
    }

    if (language === null) {
      localStorage.removeItem(storageKey);
    } else {
      if (!LANGS.includes(language)) {
        throw new Error('Недопустимый язык');
      }
      localStorage.setItem(storageKey, language);
    }
    window.dispatchEvent(new CustomEvent('frontCardLanguageChanged'));
  } catch (error) {
    console.error('Ошибка сохранения языка лицевой стороны карточки:', error);
    throw error;
  }
};
