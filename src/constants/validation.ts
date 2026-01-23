export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
} as const;

export const VALIDATION_ERRORS = {
  EMAIL_REQUIRED: 'Введите email',
  EMAIL_INVALID: 'Неверный формат email',
  PASSWORD_REQUIRED: 'Введите пароль',
  PASSWORD_TOO_SHORT: 'Пароль должен содержать минимум 6 символов',
} as const;
