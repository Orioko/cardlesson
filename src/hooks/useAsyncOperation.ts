import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isAuthenticationError } from '../utils/errorHandlingUtils';
import { useWordsContext } from './useWordsContext';

interface OperationResult {
  successCount?: number;
  errorCount?: number;
  duplicatesCount?: number;
  fixedCount?: number;
}

interface UseAsyncOperationReturn {
  executeOperation: <T extends OperationResult>(
    operation: () => Promise<T>,
    onSuccess: (result: T) => void,
    onError?: (error: unknown) => void
  ) => Promise<void>;
}

export const useAsyncOperation = (): UseAsyncOperationReturn => {
  const { refreshWords } = useWordsContext();
  const { t } = useTranslation();

  const executeOperation = useCallback(
    async <T extends OperationResult>(
      operation: () => Promise<T>,
      onSuccess: (result: T) => void,
      onError?: (error: unknown) => void
    ): Promise<void> => {
      try {
        const result = await operation();
        await refreshWords();
        onSuccess(result);
      } catch (error) {
        if (onError) {
          onError(error);
        } else if (isAuthenticationError(error)) {
          throw new Error(t('userNotAuthenticated'));
        } else {
          throw error;
        }
      }
    },
    [refreshWords, t]
  );

  return { executeOperation };
};
