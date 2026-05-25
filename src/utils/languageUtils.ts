import { LANGS } from '../components/WordCard/constants';
import type { Lang } from '../components/WordCard/types';

export const normalizeAppLanguage = (language: string): Lang => {
  const baseLanguage = language.split('-')[0];

  if (LANGS.includes(baseLanguage as Lang)) {
    return baseLanguage as Lang;
  }

  return 'en';
};

export const getLangLabel = (lang: Lang, t: (key: string) => string): string => {
  const labels: Record<Lang, string> = {
    ru: t('russian'),
    en: t('english'),
    ko: t('korean'),
  };
  return labels[lang];
};
