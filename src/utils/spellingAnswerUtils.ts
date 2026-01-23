import type { Lang } from '../components/WordCard/types';

export const stripAfterParenthesis = (value: string): string => {
  const idx = value.indexOf('(');
  if (idx === -1) {
    return value.trim();
  }
  return value.slice(0, idx).trim();
};

export const getFirstWord = (value: string): string => {
  const match = value.match(/[\p{L}\p{M}\p{N}]+/u);
  return match?.[0] || '';
};

export const normalizeSpellingValue = (value: string, lang: Lang): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (lang === 'ko') {
    return trimmed;
  }
  return trimmed.toLowerCase();
};

interface IsSpellingAnswerCorrectParams {
  answer: string;
  expected: string;
  lang: Lang;
}

export const isSpellingAnswerCorrect = ({
  answer,
  expected,
  lang,
}: IsSpellingAnswerCorrectParams): boolean => {
  const answerComparable = normalizeSpellingValue(
    getFirstWord(stripAfterParenthesis(answer)),
    lang
  );
  const expectedComparable = normalizeSpellingValue(
    getFirstWord(stripAfterParenthesis(expected)),
    lang
  );

  if (!expectedComparable) {
    return false;
  }

  return answerComparable === expectedComparable;
};
