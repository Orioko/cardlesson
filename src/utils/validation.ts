import { VALIDATION_ERRORS, VALIDATION_RULES } from '../constants/validation';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, error: VALIDATION_ERRORS.EMAIL_REQUIRED };
  }

  if (!VALIDATION_RULES.EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: VALIDATION_ERRORS.EMAIL_INVALID };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: VALIDATION_ERRORS.PASSWORD_REQUIRED };
  }

  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return { isValid: false, error: VALIDATION_ERRORS.PASSWORD_TOO_SHORT };
  }

  return { isValid: true };
};
