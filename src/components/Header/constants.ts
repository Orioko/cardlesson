import { GB, KR, RU } from 'country-flag-icons/react/3x2';
import type { ComponentType } from 'react';

export interface LanguageOption {
  label: string;
  value: string;
  flag: ComponentType<{ className?: string }>;
}

export const languageOptions: LanguageOption[] = [
  { label: 'RU', value: 'ru', flag: RU },
  { label: 'EN', value: 'en', flag: GB },
  { label: 'KO', value: 'ko', flag: KR },
];
