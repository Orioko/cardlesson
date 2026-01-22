import type { Lang } from '../components/WordCard/types';

export const getLangLabel = (lang: Lang, t: (key: string) => string): string => {
  const labels: Record<Lang, string> = {
    ru: t('russian'),
    en: t('english'),
    ko: t('korean'),
  };
  return labels[lang];
};
