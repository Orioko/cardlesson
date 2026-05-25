import { getUserId } from './localAuth';

const LEGACY_SETTINGS_MIGRATED_KEY = 'user_settings_legacy_migrated';
const LEGACY_FRONT_CARD_LANGUAGE_KEY = 'front_card_language';
const LEGACY_SELECTED_LANGUAGES_KEY = 'selected_languages';
const LEGACY_I18N_LANGUAGE_KEY = 'i18nextLng';
const APP_LANGUAGE_KEY = 'app_language';
const FRONT_CARD_LANGUAGE_KEY = 'front_card_language';
const SELECTED_LANGUAGES_KEY = 'selected_languages';

export const getUserScopedStorageKey = (baseKey: string): string | null => {
  const userId = getUserId();

  if (!userId) {
    return null;
  }

  return `${baseKey}_${userId}`;
};

const copyLegacyValue = (legacyKey: string, scopedKey: string): void => {
  const legacyValue = localStorage.getItem(legacyKey);

  if (legacyValue === null || localStorage.getItem(scopedKey) !== null) {
    return;
  }

  localStorage.setItem(scopedKey, legacyValue);
  localStorage.removeItem(legacyKey);
};

export const migrateSharedLegacySettingsIfNeeded = (): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (localStorage.getItem(LEGACY_SETTINGS_MIGRATED_KEY)) {
      return;
    }

    const userId = getUserId();

    if (!userId) {
      return;
    }

    const hasLegacySettings =
      localStorage.getItem(LEGACY_FRONT_CARD_LANGUAGE_KEY) !== null ||
      localStorage.getItem(LEGACY_SELECTED_LANGUAGES_KEY) !== null ||
      localStorage.getItem(LEGACY_I18N_LANGUAGE_KEY) !== null;

    if (!hasLegacySettings) {
      localStorage.setItem(LEGACY_SETTINGS_MIGRATED_KEY, '1');
      return;
    }

    copyLegacyValue(LEGACY_FRONT_CARD_LANGUAGE_KEY, `${FRONT_CARD_LANGUAGE_KEY}_${userId}`);
    copyLegacyValue(LEGACY_SELECTED_LANGUAGES_KEY, `${SELECTED_LANGUAGES_KEY}_${userId}`);
    copyLegacyValue(LEGACY_I18N_LANGUAGE_KEY, `${APP_LANGUAGE_KEY}_${userId}`);

    localStorage.setItem(LEGACY_SETTINGS_MIGRATED_KEY, '1');
  } catch (error) {
    console.error('Ошибка миграции настроек:', error);
  }
};
