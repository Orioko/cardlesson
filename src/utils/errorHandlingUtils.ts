import { ERROR_MESSAGES } from '../constants/errors';

export const isAuthenticationError = (error: unknown): boolean => {
  return error instanceof Error && error.message === ERROR_MESSAGES.USER_NOT_AUTHENTICATED;
};

export const isInvalidFileFormatError = (error: unknown): boolean => {
  return error instanceof Error && error.message === ERROR_MESSAGES.INVALID_FILE_FORMAT;
};

export const isDuplicateWordError = (error: unknown): boolean => {
  return error instanceof Error && error.message === ERROR_MESSAGES.DUPLICATE_WORD;
};
