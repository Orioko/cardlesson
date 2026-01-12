import { LANGS } from '../components/WordCard/constants';
import type { Lang } from '../components/WordCard/types';

const FRONT_CARD_LANGUAGE_KEY = 'front_card_language';

export const getFrontCardLanguage = (): Lang | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const stored = localStorage.getItem(FRONT_CARD_LANGUAGE_KEY);
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

    if (language === null) {
      localStorage.removeItem(FRONT_CARD_LANGUAGE_KEY);
    } else {
      if (!LANGS.includes(language)) {
        throw new Error('Недопустимый язык');
      }
      localStorage.setItem(FRONT_CARD_LANGUAGE_KEY, language);
    }
    window.dispatchEvent(new CustomEvent('frontCardLanguageChanged'));
  } catch (error) {
    console.error('Ошибка сохранения языка лицевой стороны карточки:', error);
    throw error;
  }
};
