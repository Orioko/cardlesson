import { getFrontCardLanguage } from '../../utils/frontCardLanguageStorage';
import { createEphemeralRng, getRuntimeRandomSalt } from '../../utils/runtimeRandom';
import { LANGS } from './constants';
import type { Lang, WordData } from './types';

export const pickRandom = <T>(arr: T[]): T | undefined => {
  if (arr.length === 0) {
    return undefined;
  }

  const rng = createEphemeralRng('wordcard_pickRandom');
  return arr[Math.floor(rng() * arr.length)];
};

export const pickDeterministic = <T>(arr: T[], key: string): T | undefined => {
  if (arr.length === 0) {
    return undefined;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return arr[Math.abs(hash) % arr.length];
};

export const getFilledLanguages = (wordData: WordData): Lang[] => {
  return LANGS.filter((l) => wordData[l]?.trim());
};

export const getFrontLanguage = (
  wordData: WordData | undefined,
  displayLang: Lang | undefined,
  wordId: string | undefined
): Lang | null => {
  if (displayLang && wordData?.[displayLang]?.trim()) {
    return displayLang;
  }

  if (!wordData) {
    return null;
  }

  const filled = getFilledLanguages(wordData);
  if (filled.length === 0) {
    return null;
  }

  const savedFrontLang = getFrontCardLanguage();

  if (savedFrontLang !== null) {
    if (filled.includes(savedFrontLang) && wordData[savedFrontLang]?.trim()) {
      return savedFrontLang;
    }
    return savedFrontLang;
  }

  if (wordId) {
    return pickDeterministic(filled, `${getRuntimeRandomSalt()}_${wordId}`) || null;
  }

  return pickRandom(filled) || null;
};
