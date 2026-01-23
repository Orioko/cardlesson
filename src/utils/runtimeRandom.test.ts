import { describe, expect, it } from 'vitest';
import {
  createEphemeralRng,
  createMulberry32,
  getRuntimeRandomSalt,
  hashStringToUint32,
} from './runtimeRandom';

describe('runtimeRandom', () => {
  describe('getRuntimeRandomSalt', () => {
    it('возвращает одинаковое значение при повторных вызовах', () => {
      const salt1 = getRuntimeRandomSalt();
      const salt2 = getRuntimeRandomSalt();
      expect(salt1).toBe(salt2);
      expect(typeof salt1).toBe('string');
      expect(salt1.length).toBeGreaterThan(0);
    });
  });

  describe('hashStringToUint32', () => {
    it('возвращает число для любой строки', () => {
      const hash1 = hashStringToUint32('test');
      const hash2 = hashStringToUint32('hello');
      expect(typeof hash1).toBe('number');
      expect(typeof hash2).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash2).toBeGreaterThanOrEqual(0);
    });

    it('возвращает одинаковый хеш для одинаковых строк', () => {
      const hash1 = hashStringToUint32('test');
      const hash2 = hashStringToUint32('test');
      expect(hash1).toBe(hash2);
    });

    it('возвращает разные хеши для разных строк', () => {
      const hash1 = hashStringToUint32('test');
      const hash2 = hashStringToUint32('different');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createMulberry32', () => {
    it('создает функцию генератора случайных чисел', () => {
      const rng = createMulberry32(12345);
      expect(typeof rng).toBe('function');
    });

    it('возвращает числа в диапазоне [0, 1)', () => {
      const rng = createMulberry32(12345);
      for (let i = 0; i < 100; i++) {
        const num = rng();
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      }
    });

    it('генерирует детерминированную последовательность для одного seed', () => {
      const rng1 = createMulberry32(12345);
      const rng2 = createMulberry32(12345);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('генерирует разные последовательности для разных seed', () => {
      const rng1 = createMulberry32(12345);
      const rng2 = createMulberry32(54321);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('createEphemeralRng', () => {
    it('создает функцию генератора случайных чисел', () => {
      const rng = createEphemeralRng('test-scope');
      expect(typeof rng).toBe('function');
    });

    it('возвращает числа в диапазоне [0, 1)', () => {
      const rng = createEphemeralRng('test-scope-2');
      for (let i = 0; i < 10; i++) {
        const num = rng();
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      }
    });

    it('создает разные генераторы для одного scope при повторных вызовах', () => {
      const rng1 = createEphemeralRng('same-scope');
      const rng2 = createEphemeralRng('same-scope');

      const val1 = rng1();
      const val2 = rng2();

      expect(val1).not.toBe(val2);
    });
  });
});
