import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ERROR_MESSAGES } from '../../../../shared/constants/errors';
import type { Word } from '../../../../shared/types/word';
import { createWordInput } from '../../../../shared/utils/wordDataHelpers';
import { normalizeWord, wordsAreEqual } from '../../../../shared/utils/wordsDuplicatesCheck';
import { addWord, fetchWords, updateWord } from '../../api/wordsApi';
import { requireUserId } from '../auth/localAuth';
import { saveStoredWords } from './wordsStorage';

export interface ImportResult {
  addedCount: number;
  errorCount: number;
  duplicatesCount: number;
}

export interface CheckDuplicatesResult {
  duplicatesCount: number;
  uniqueWordsCount: number;
}

export interface FixWordsLanguagesResult {
  fixedCount: number;
  errorCount: number;
}

type WordData = Partial<Word>;

const KOREAN_REGEX = /[\uAC00-\uD7A3]/;
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /^[a-zA-Z\s'-]+$/;

const detectLanguage = (text: string): 'ru' | 'en' | 'ko' | null => {
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

const autoDistributeWords = (wordValues: { ru: string; en: string; ko: string }) => {
  const detected: Record<'ru' | 'en' | 'ko', string[]> = {
    ru: [],
    en: [],
    ko: [],
  };
  const result = {
    ru: '',
    en: '',
    ko: '',
  };

  Object.entries(wordValues).forEach(([field, value]) => {
    if (!value?.trim()) {
      return;
    }

    const fieldLang = field as 'ru' | 'en' | 'ko';
    const detectedLang = detectLanguage(value);

    if (detectedLang === fieldLang) {
      result[fieldLang] = value.trim();
    } else if (detectedLang) {
      detected[detectedLang].push(value.trim());
    }
  });

  (Object.keys(detected) as Array<'ru' | 'en' | 'ko'>).forEach((lang) => {
    if (!result[lang] && detected[lang].length > 0) {
      result[lang] = detected[lang][0];
    } else if (!result[lang]) {
      result[lang] = wordValues[lang].trim();
    }
  });

  return result;
};

const filterDuplicateWords = (importedWords: WordData[], existingWords: WordData[]): WordData[] => {
  const normalizedExisting = existingWords.map(normalizeWord);
  const uniqueImported: WordData[] = [];
  const seenImported = new Set<string>();

  for (const word of importedWords) {
    const normalized = normalizeWord(word);
    const normalizedKey = [normalized.ru, normalized.en, normalized.ko]
      .sort()
      .filter((value) => value.length > 0)
      .join('|');

    if (!normalizedKey) {
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

export const checkAndRemoveDuplicates = async (): Promise<CheckDuplicatesResult> => {
  const words = await fetchWords();
  if (words.length === 0) {
    return { duplicatesCount: 0, uniqueWordsCount: 0 };
  }

  const uniqueWords: Word[] = [];
  const seenKeys = new Set<string>();

  for (const word of words) {
    const normalized = normalizeWord(word);
    const normalizedKey = [normalized.ru, normalized.en, normalized.ko]
      .sort()
      .filter((value) => value.length > 0)
      .join('|');

    if (!normalizedKey || seenKeys.has(normalizedKey)) {
      continue;
    }

    const isDuplicate = uniqueWords.some((uniqueWord) =>
      wordsAreEqual(normalized, normalizeWord(uniqueWord))
    );
    if (!isDuplicate) {
      seenKeys.add(normalizedKey);
      uniqueWords.push(word);
    }
  }

  const duplicatesCount = words.length - uniqueWords.length;
  if (duplicatesCount > 0) {
    const userId = await requireUserId();
    await saveStoredWords(userId, uniqueWords);
  }

  return {
    duplicatesCount,
    uniqueWordsCount: uniqueWords.length,
  };
};

export const fixWordsLanguages = async (): Promise<FixWordsLanguagesResult> => {
  const words = await fetchWords();
  let fixedCount = 0;
  let errorCount = 0;

  for (const word of words) {
    try {
      const originalValues = {
        ru: word.ru || '',
        en: word.en || '',
        ko: word.ko || '',
      };
      const distributed = autoDistributeWords(originalValues);
      const hasChanges =
        distributed.ru !== originalValues.ru ||
        distributed.en !== originalValues.en ||
        distributed.ko !== originalValues.ko;

      if (hasChanges) {
        await updateWord(word.id, {
          ru: distributed.ru,
          en: distributed.en,
          ko: distributed.ko,
          translations: {
            ru: distributed.ru,
            en: distributed.en,
            ko: distributed.ko,
          },
        });
        fixedCount++;
      }
    } catch {
      errorCount++;
    }
  }

  return {
    fixedCount,
    errorCount,
  };
};

export const exportWordsToJson = async (): Promise<void> => {
  const words = await fetchWords();
  const jsonContent = JSON.stringify(words, null, 2);
  const directory = FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Cache directory unavailable');
  }

  const filePath = `${directory}words-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(filePath, jsonContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Export words',
    UTI: 'public.json',
  });
};

export const importWordsFromPickedFile = async (): Promise<ImportResult | null> => {
  const pickedFile = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (pickedFile.canceled) {
    return null;
  }

  const fileAsset = pickedFile.assets[0];
  const text = await FileSystem.readAsStringAsync(fileAsset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsedJson = JSON.parse(text);

  if (!Array.isArray(parsedJson)) {
    throw new Error(ERROR_MESSAGES.INVALID_FILE_FORMAT);
  }

  const importedWords = parsedJson as WordData[];
  const existingWords = await fetchWords();
  const uniqueImportedWords = filterDuplicateWords(importedWords, existingWords);

  let addedCount = 0;
  let errorCount = 0;
  const duplicatesCount = importedWords.length - uniqueImportedWords.length;

  for (const word of uniqueImportedWords) {
    try {
      const wordInput = createWordInput({
        ru: word.ru || word.translations?.ru || '',
        en: word.en || word.translations?.en || '',
        ko: word.ko || word.translations?.ko || '',
      });
      const filledFields = [wordInput.ru, wordInput.en, wordInput.ko].filter(
        (field) => field.trim().length > 0
      ).length;

      if (filledFields >= 2) {
        await addWord(wordInput);
        addedCount++;
      } else {
        errorCount++;
      }
    } catch {
      errorCount++;
    }
  }

  return {
    addedCount,
    errorCount,
    duplicatesCount,
  };
};
