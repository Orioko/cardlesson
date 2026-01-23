import { describe, expect, it } from 'vitest';
import { createWordInput, transformToWord } from './wordDataHelpers';

describe('wordDataHelpers', () => {
  describe('transformToWord', () => {
    it('преобразует данные в объект Word', () => {
      const data = {
        ru: 'привет',
        en: 'hello',
        ko: '안녕하세요',
        translations: {
          ru: 'привет',
          en: 'hello',
          ko: '안녕하세요',
        },
      };

      const result = transformToWord('123', data);

      expect(result).toEqual({
        id: '123',
        ru: 'привет',
        en: 'hello',
        ko: '안녕하세요',
        translations: {
          ru: 'привет',
          en: 'hello',
          ko: '안녕하세요',
        },
      });
    });
  });

  describe('createWordInput', () => {
    it('создает объект WordInput из данных', () => {
      const data = {
        ru: 'привет',
        en: 'hello',
        ko: '안녕하세요',
      };

      const result = createWordInput(data);

      expect(result).toEqual({
        ru: 'привет',
        en: 'hello',
        ko: '안녕하세요',
        translations: {
          ru: 'привет',
          en: 'hello',
          ko: '안녕하세요',
        },
      });
    });

    it('копирует значения в translations', () => {
      const data = {
        ru: 'один',
        en: 'one',
        ko: '하나',
      };

      const result = createWordInput(data);

      expect(result.translations.ru).toBe(data.ru);
      expect(result.translations.en).toBe(data.en);
      expect(result.translations.ko).toBe(data.ko);
    });
  });
});
