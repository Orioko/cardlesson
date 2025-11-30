interface WordData {
  id?: string;
  ru?: string;
  en?: string;
  ko?: string;
  translations?: {
    ru?: string;
    en?: string;
    ko?: string;
  };
}

interface WordDataNormalized {
  ru: string;
  en: string;
  ko: string;
}

const normalizeWord = (word: WordData): WordDataNormalized => {
  const getFieldValue = (main: string | undefined, translation: string | undefined): string => {
    const value = (main || translation || '').trim().toLowerCase();
    return value;
  };

  return {
    ru: getFieldValue(word.ru, word.translations?.ru),
    en: getFieldValue(word.en, word.translations?.en),
    ko: getFieldValue(word.ko, word.translations?.ko),
  };
};

const wordsAreEqual = (word1: WordDataNormalized, word2: WordDataNormalized): boolean => {
  const getNonEmptyValues = (word: WordDataNormalized): string[] => {
    return [word.ru, word.en, word.ko].filter((value) => value.length > 0).sort();
  };

  const values1 = getNonEmptyValues(word1);
  const values2 = getNonEmptyValues(word2);

  if (values1.length !== values2.length || values1.length < 2) {
    return false;
  }

  if (values1.length === 0) {
    return false;
  }

  return values1.every((value, index) => value === values2[index]);
};

export const filterDuplicateWords = (
  importedWords: WordData[],
  existingWords: WordData[]
): WordData[] => {
  const normalizedExisting = existingWords.map(normalizeWord);

  const uniqueImported: WordData[] = [];
  const seenImported = new Set<string>();

  for (const word of importedWords) {
    const normalized = normalizeWord(word);
    const normalizedKey = [normalized.ru, normalized.en, normalized.ko]
      .sort()
      .filter((v) => v.length > 0)
      .join('|');

    if (normalizedKey.length === 0) {
      continue;
    }

    if (seenImported.has(normalizedKey)) {
      continue;
    }

    const isDuplicate = normalizedExisting.some((existing) => wordsAreEqual(normalized, existing));

    if (!isDuplicate) {
      seenImported.add(normalizedKey);
      uniqueImported.push(word);
    }
  }

  return uniqueImported;
};
