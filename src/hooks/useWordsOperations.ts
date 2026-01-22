import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { checkAndRemoveDuplicates } from '../utils/cleanupDuplicates';
import { isAuthenticationError, isInvalidFileFormatError } from '../utils/errorHandlingUtils';
import { fixWordsLanguages } from '../utils/fixWordsLanguages';
import { formatImportMessages } from '../utils/importMessagesUtils';
import { exportWordsToJson, importWordsFromFile } from '../utils/wordsImportExport';
import { useAsyncOperation } from './useAsyncOperation';
import { useWordsContext } from './useWordsContext';

interface UseWordsOperationsReturn {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleExportWords: () => void;
  handleImportWords: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportButtonClick: () => void;
  handleCheckDuplicates: () => Promise<void>;
  handleFixWordsLanguages: () => Promise<void>;
}

interface UseWordsOperationsProps {
  setError: (message: string) => void;
  setStatusMessage: (message: string, severity?: 'error' | 'success' | 'info') => void;
  clearMessages: () => void;
}

export const useWordsOperations = ({
  setError,
  setStatusMessage,
  clearMessages,
}: UseWordsOperationsProps): UseWordsOperationsReturn => {
  const { t } = useTranslation();
  const { words, refreshWords } = useWordsContext();
  const { executeOperation } = useAsyncOperation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportWords = useCallback(() => {
    try {
      exportWordsToJson(words);
    } catch {
      setError(t('errorExportingWords'));
    }
  }, [words, setError, t]);

  const handleImportWords = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      clearMessages();
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const result = await importWordsFromFile(file);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        if (result.addedCount > 0 || result.duplicatesCount > 0 || result.errorCount > 0) {
          await refreshWords();

          const messages = formatImportMessages(result, t);
          if (messages.length > 0) {
            setError(messages.join('. '));
          } else {
            setError(t('noWordsImported') || 'Не удалось импортировать слова');
          }
        } else {
          setError(t('noWordsImported') || 'Не удалось импортировать слова');
        }
      } catch (importError) {
        if (isInvalidFileFormatError(importError)) {
          setError(t('invalidFileFormat'));
        } else {
          setError(t('errorImportingWords') || 'Ошибка при импорте слов');
        }
      }
    },
    [clearMessages, refreshWords, setError, t]
  );

  const handleImportButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCheckDuplicates = useCallback(async () => {
    clearMessages();
    await executeOperation(
      () => checkAndRemoveDuplicates(),
      (result) => {
        if (result.duplicatesCount > 0) {
          setStatusMessage(
            t('duplicatesRemoved', { count: result.duplicatesCount }) ||
              `Удалено дубликатов: ${result.duplicatesCount}`,
            'success'
          );
        } else {
          setStatusMessage(t('noDuplicatesFound') || 'Дубликаты не найдены', 'info');
        }
      },
      (duplicatesError) => {
        if (isAuthenticationError(duplicatesError)) {
          setError(t('userNotAuthenticated'));
        } else {
          setError(t('errorCheckingDuplicates') || 'Ошибка при проверке дубликатов');
        }
      }
    );
  }, [clearMessages, executeOperation, setError, setStatusMessage, t]);

  const handleFixWordsLanguages = useCallback(async () => {
    clearMessages();
    await executeOperation(
      () => fixWordsLanguages(),
      (result) => {
        if (result.fixedCount > 0) {
          setStatusMessage(
            t('wordsLanguagesFixed', { count: result.fixedCount }) ||
              `Исправлено слов: ${result.fixedCount}`,
            'success'
          );
        } else {
          setStatusMessage(t('noWordsToFix') || 'Нет слов для исправления', 'info');
        }

        if (result.errorCount > 0) {
          setError(
            t('errorsDuringFix', { count: result.errorCount }) || `Ошибок: ${result.errorCount}`
          );
        }
      },
      (fixError) => {
        if (isAuthenticationError(fixError)) {
          setError(t('userNotAuthenticated'));
        } else {
          setError(t('errorFixingWordsLanguages') || 'Ошибка при исправлении языков слов');
        }
      }
    );
  }, [clearMessages, executeOperation, setError, setStatusMessage, t]);

  return {
    fileInputRef,
    handleExportWords,
    handleImportWords,
    handleImportButtonClick,
    handleCheckDuplicates,
    handleFixWordsLanguages,
  };
};
