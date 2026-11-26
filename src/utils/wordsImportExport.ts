import { capitalizeFirstLetter } from './wordDataHelpers';
import { importWords } from './wordsApi';
import { backupFileName, markBackupDone } from './wordsBackup';

export interface WordData {
  id?: string;
  ru?: string;
  en?: string;
  ko?: string;
  translations?: {
    ru?: string;
    en?: string;
    ko?: string;
  };
  createdAt?: string | number | Date;
}

export interface ImportResult {
  addedCount: number;
  errorCount: number;
  duplicatesCount: number;
}

// exportWordsToJson скачивает словарь файлом; это и есть резервная копия —
// восстановить её можно кнопкой «Загрузить слова».
export const exportWordsToJson = (words: WordData[]): void => {
  try {
    const jsonContent = JSON.stringify(words, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    markBackupDone();
  } catch (error) {
    console.error('Ошибка при экспорте слов:', error);
    throw error;
  }
};

const isObject = (value: unknown): value is WordData =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

// importWordsFromFile отправляет слова на сервер одним запросом; дубли и пустые слова сервер считает сам.
export const importWordsFromFile = async (file: File): Promise<ImportResult> => {
  try {
    const text = await file.text();
    const importedWords: unknown = JSON.parse(text);

    if (!Array.isArray(importedWords)) {
      throw new Error('Invalid file format: expected array of words');
    }

    let errorCount = 0;
    const prepared = [];
    for (const word of importedWords) {
      if (!isObject(word)) {
        errorCount++;
        continue;
      }
      const ru = capitalizeFirstLetter(asText(word.ru));
      const en = capitalizeFirstLetter(asText(word.en));
      const ko = capitalizeFirstLetter(asText(word.ko));
      prepared.push({
        ru,
        en,
        ko,
        translations: {
          ru: capitalizeFirstLetter(asText(word.translations?.ru) || ru),
          en: capitalizeFirstLetter(asText(word.translations?.en) || en),
          ko: capitalizeFirstLetter(asText(word.translations?.ko) || ko),
        },
        createdAt: word.createdAt instanceof Date ? word.createdAt.toISOString() : word.createdAt,
      });
    }

    const result = await importWords(prepared);
    return {
      addedCount: result.addedCount,
      duplicatesCount: result.duplicatesCount,
      errorCount: errorCount + result.errorCount,
    };
  } catch (error) {
    console.error('Ошибка при импорте слов:', error);
    throw error;
  }
};
