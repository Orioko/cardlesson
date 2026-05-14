export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  LOCAL_LOGIN_REGEX: /^[a-zA-Z0-9._-]{2,64}$/,
  MIN_PASSWORD_LENGTH: 6,
} as const;

export const VALIDATION_ERRORS = {
  EMAIL_REQUIRED: 'Введите email',
  EMAIL_INVALID: 'Неверный формат email',
  PASSWORD_REQUIRED: 'Введите пароль',
  PASSWORD_TOO_SHORT: 'Пароль должен содержать минимум 6 символов',
} as const;
