import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ERROR_MESSAGES } from '../../../../shared/constants/errors';
import type { Word } from '../../../../shared/types/word';
import { createWordInput } from '../../../../shared/utils/wordDataHelpers';
import { dedupeWords, fetchWords, importWords, updateWord } from '../../api/wordsApi';

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

// Повторы ищет и удаляет сервер: из одинаковых слов остаётся самое новое.
export const checkAndRemoveDuplicates = (): Promise<CheckDuplicatesResult> => dedupeWords();

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

  let errorCount = 0;
  const prepared: WordData[] = [];
  for (const word of parsedJson as unknown[]) {
    if (typeof word !== 'object' || word === null) {
      errorCount++;
      continue;
    }
    const w = word as WordData;
    const asText = (v: unknown) => (typeof v === 'string' ? v : '');
    prepared.push({
      ...createWordInput({
        ru: asText(w.ru) || asText(w.translations?.ru),
        en: asText(w.en) || asText(w.translations?.en),
        ko: asText(w.ko) || asText(w.translations?.ko),
      }),
      createdAt: w.createdAt,
    });
  }

  // Слова уходят на сервер одним запросом; дубли и слова меньше чем на двух языках он считает сам.
  const result = await importWords(prepared);
  return {
    addedCount: result.addedCount,
    errorCount: errorCount + result.errorCount,
    duplicatesCount: result.duplicatesCount,
  };
};
