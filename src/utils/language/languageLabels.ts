import type { TFunction } from 'i18next';
import type { Lang } from '../../components/WordCard/types';

export const getLanguageLabel = (lang: Lang, t: TFunction): string => {
  const labels: Record<Lang, string> = {
    ru: t('russianWord'),
    en: t('englishWord'),
    ko: t('koreanWord'),
  };
  return labels[lang];
};

export const getLanguagePlaceholder = (lang: Lang, t: TFunction): string => {
  const placeholders: Record<Lang, string> = {
    ru: t('enterRussianWord'),
    en: t('enterEnglishWord'),
    ko: t('enterKoreanWord'),
  };
  return placeholders[lang];
};
