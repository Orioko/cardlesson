import type { Lang } from '../components/WordCard/types';

const KOREAN_REGEX = /[\uAC00-\uD7A3]/;
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /^[a-zA-Z\s'-]+$/;

export const detectLanguage = (text: string): Lang | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (KOREAN_REGEX.test(trimmed)) {
    return 'ko';
  }

  if (CYRILLIC_REGEX.test(trimmed)) {
    return 'ru';
  }

  if (LATIN_REGEX.test(trimmed)) {
    return 'en';
  }

  return null;
};

export interface WordFields {
  ru: string;
  en: string;
  ko: string;
}

export const autoDistributeWords = (wordValues: WordFields): WordFields => {
  const detected: Record<Lang, string[]> = {
    ru: [],
    en: [],
    ko: [],
  };

  const result: WordFields = {
    ru: '',
    en: '',
    ko: '',
  };

  Object.entries(wordValues).forEach(([field, value]) => {
    if (!value?.trim()) {
      return;
    }

    const fieldLang = field as Lang;
    const detectedLang = detectLanguage(value);

    if (detectedLang === fieldLang) {
      result[fieldLang] = value.trim();
    } else if (detectedLang) {
      detected[detectedLang].push(value.trim());
    }
  });

  Object.entries(detected).forEach(([lang, values]) => {
    const langKey = lang as Lang;
    if (result[langKey] === '' && values.length > 0) {
      result[langKey] = values[0];
    } else if (result[langKey] === '') {
      result[langKey] = wordValues[langKey].trim();
    }
  });

  return result;
};
