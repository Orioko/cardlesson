import { autoDistributeWords } from './languageDetection';
import { fetchWords, updateWord } from './wordsApi';

export interface FixWordsLanguagesResult {
  fixedCount: number;
  errorCount: number;
}

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
    } catch (error) {
      console.error('Ошибка при исправлении слова:', error);
      errorCount++;
    }
  }

  return { fixedCount, errorCount };
};
