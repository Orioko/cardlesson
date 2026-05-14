import { LANGS, type Lang } from '../../../../shared/types/lang';
import { getStorageItem, setStorageItem } from './asyncStorage';

const SELECTED_LANGUAGES_KEY = 'cardlesson_mobile_selected_languages';
const FRONT_CARD_LANGUAGE_KEY = 'cardlesson_mobile_front_card_language';
const APP_LANGUAGE_KEY = 'cardlesson_mobile_app_language';

export type AppLanguage = 'ru' | 'en';

export const getSelectedLanguages = async (): Promise<Lang[]> => {
  const stored = await getStorageItem<Lang[]>(SELECTED_LANGUAGES_KEY);

  if (!stored) {
    return LANGS;
  }

  const valid = stored.filter((lang) => LANGS.includes(lang));

  if (valid.length < 2) {
    return LANGS;
  }

  return valid;
};

export const saveSelectedLanguages = async (languages: Lang[]): Promise<void> => {
  const valid = languages.filter((lang) => LANGS.includes(lang));

  if (valid.length < 2) {
    throw new Error('MIN_TWO_LANGUAGES_REQUIRED');
  }

  await setStorageItem(SELECTED_LANGUAGES_KEY, valid);
};

export const getFrontCardLanguage = async (): Promise<Lang | null> => {
  const stored = await getStorageItem<Lang | null>(FRONT_CARD_LANGUAGE_KEY);

  if (!stored) {
    return null;
  }

  if (!LANGS.includes(stored)) {
    return null;
  }

  return stored;
};

export const saveFrontCardLanguage = async (language: Lang | null): Promise<void> => {
  await setStorageItem(FRONT_CARD_LANGUAGE_KEY, language);
};

export const getAppLanguage = async (): Promise<AppLanguage> => {
  const stored = await getStorageItem<AppLanguage>(APP_LANGUAGE_KEY);

  if (stored === 'ru' || stored === 'en') {
    return stored;
  }

  return 'ru';
};

export const saveAppLanguage = async (language: AppLanguage): Promise<void> => {
  await setStorageItem(APP_LANGUAGE_KEY, language);
};
