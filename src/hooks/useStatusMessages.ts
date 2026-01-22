import { useCallback, useState } from 'react';

type StatusSeverity = 'error' | 'success' | 'info';

interface UseStatusMessagesReturn {
  error: string;
  statusMessage: string;
  statusSeverity: StatusSeverity;
  setError: (message: string) => void;
  setStatusMessage: (message: string, severity?: StatusSeverity) => void;
  clearMessages: () => void;
}

export const useStatusMessages = (): UseStatusMessagesReturn => {
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessageState] = useState('');
  const [statusSeverity, setStatusSeverity] = useState<StatusSeverity>('error');

  const setStatusMessage = useCallback((message: string, severity: StatusSeverity = 'success') => {
    setStatusMessageState(message);
    setStatusSeverity(severity);
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setStatusMessageState('');
  }, []);

  return {
    error,
    statusMessage,
    statusSeverity,
    setError,
    setStatusMessage,
    clearMessages,
  };
};
