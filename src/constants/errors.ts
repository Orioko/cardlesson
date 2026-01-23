export const ERROR_MESSAGES = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INVALID_FILE_FORMAT: 'Invalid file format: expected array of words',
  DUPLICATE_WORD: 'DUPLICATE_WORD',
  WORD_NOT_FOUND: 'Word not found',
  LOCALSTORAGE_NOT_SUPPORTED: 'localStorage не поддерживается',
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
