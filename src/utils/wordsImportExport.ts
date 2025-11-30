import { addWord, fetchWords } from './wordsApi';
import { filterDuplicateWords } from './wordsDuplicatesCheck';

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
}

export interface ImportResult {
  addedCount: number;
  errorCount: number;
  duplicatesCount: number;
}

export const exportWordsToJson = (words: WordData[]): void => {
  try {
    const jsonContent = JSON.stringify(words, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'words.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка при экспорте слов:', error);
    throw error;
  }
};

export const importWordsFromFile = async (file: File): Promise<ImportResult> => {
  try {
    const text = await file.text();
    const importedWords = JSON.parse(text);

    if (!Array.isArray(importedWords)) {
      throw new Error('Invalid file format: expected array of words');
    }

    const existingWords = await fetchWords();
    const uniqueImportedWords = filterDuplicateWords(importedWords, existingWords);
    const duplicatesCount = importedWords.length - uniqueImportedWords.length;

    let addedCount = 0;
    let errorCount = 0;

    for (const word of uniqueImportedWords) {
      try {
        if (word.ru || word.en || word.ko) {
          const wordData = {
            ru: word.ru || '',
            en: word.en || '',
            ko: word.ko || '',
            translations: {
              ru: word.translations?.ru || word.ru || '',
              en: word.translations?.en || word.en || '',
              ko: word.translations?.ko || word.ko || '',
            },
          };

          const filledFields = [wordData.ru, wordData.en, wordData.ko].filter(
            (field) => field.trim().length > 0
          ).length;

          if (filledFields >= 2) {
            await addWord(wordData);
            addedCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Ошибка при добавлении слова:', error);
        errorCount++;
      }
    }

    return { addedCount, errorCount, duplicatesCount };
  } catch (error) {
    console.error('Ошибка при импорте слов:', error);
    throw error;
  }
};
