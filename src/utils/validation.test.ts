import { describe, expect, it } from 'vitest';
import { validateEmail, validatePassword } from './validation';

describe('validateEmail', () => {
  it('валидирует корректный email', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('отклоняет пустой email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('отклоняет email с пробелами', () => {
    const result = validateEmail('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('отклоняет невалидный email', () => {
    const result1 = validateEmail('invalid');
    expect(result1.isValid).toBe(false);

    const result2 = validateEmail('invalid@');
    expect(result2.isValid).toBe(false);

    const result3 = validateEmail('@example.com');
    expect(result3.isValid).toBe(false);
  });

  it('обрезает пробелы перед валидацией', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result.isValid).toBe(true);
  });
});

describe('validatePassword', () => {
  it('валидирует корректный пароль', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('отклоняет пустой пароль', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('отклоняет слишком короткий пароль', () => {
    const result = validatePassword('12345');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('принимает пароль минимальной длины', () => {
    const result = validatePassword('123456');
    expect(result.isValid).toBe(true);
  });
});
