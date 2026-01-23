import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '../components/WordCard/types';
import { getLangLabel } from './languageUtils';

describe('languageUtils', () => {
  describe('getLangLabel', () => {
    const mockT = vi.fn((key: string) => key);

    it('возвращает метку для русского языка', () => {
      const result = getLangLabel('ru' as Lang, mockT);
      expect(result).toBe('russian');
      expect(mockT).toHaveBeenCalledWith('russian');
    });

    it('возвращает метку для английского языка', () => {
      const result = getLangLabel('en' as Lang, mockT);
      expect(result).toBe('english');
      expect(mockT).toHaveBeenCalledWith('english');
    });

    it('возвращает метку для корейского языка', () => {
      const result = getLangLabel('ko' as Lang, mockT);
      expect(result).toBe('korean');
      expect(mockT).toHaveBeenCalledWith('korean');
    });
  });
});
