import type { ImportResult } from './wordsImportExport';

export const formatImportMessages = (
  result: ImportResult,
  t: (key: string, params?: { count: number }) => string
): string[] => {
  const messages: string[] = [];

  if (result.addedCount > 0) {
    messages.push(
      t('wordsImported', { count: result.addedCount }) || `Добавлено слов: ${result.addedCount}`
    );
  }

  if (result.duplicatesCount > 0) {
    messages.push(
      t('duplicatesSkipped', { count: result.duplicatesCount }) ||
        `Пропущено дубликатов: ${result.duplicatesCount}`
    );
  }

  if (result.errorCount > 0) {
    messages.push(
      t('errorsDuringImport', { count: result.errorCount }) || `Ошибок: ${result.errorCount}`
    );
  }

  return messages;
};
