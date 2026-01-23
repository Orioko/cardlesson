import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '../components/WordCard/types';
import { getLanguageLabel, getLanguagePlaceholder } from './languageLabels';

describe('languageLabels', () => {
  const mockT = vi.fn((key: string) => key);
  const t = mockT as unknown as TFunction;

  describe('getLanguageLabel', () => {
    it('возвращает метку для русского языка', () => {
      const result = getLanguageLabel('ru' as Lang, t);
      expect(result).toBe('russianWord');
      expect(mockT).toHaveBeenCalledWith('russianWord');
    });

    it('возвращает метку для английского языка', () => {
      const result = getLanguageLabel('en' as Lang, t);
      expect(result).toBe('englishWord');
      expect(mockT).toHaveBeenCalledWith('englishWord');
    });

    it('возвращает метку для корейского языка', () => {
      const result = getLanguageLabel('ko' as Lang, t);
      expect(result).toBe('koreanWord');
      expect(mockT).toHaveBeenCalledWith('koreanWord');
    });
  });

  describe('getLanguagePlaceholder', () => {
    it('возвращает placeholder для русского языка', () => {
      const result = getLanguagePlaceholder('ru' as Lang, t);
      expect(result).toBe('enterRussianWord');
      expect(mockT).toHaveBeenCalledWith('enterRussianWord');
    });

    it('возвращает placeholder для английского языка', () => {
      const result = getLanguagePlaceholder('en' as Lang, t);
      expect(result).toBe('enterEnglishWord');
      expect(mockT).toHaveBeenCalledWith('enterEnglishWord');
    });

    it('возвращает placeholder для корейского языка', () => {
      const result = getLanguagePlaceholder('ko' as Lang, t);
      expect(result).toBe('enterKoreanWord');
      expect(mockT).toHaveBeenCalledWith('enterKoreanWord');
    });
  });
});
