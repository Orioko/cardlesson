import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adjustPaginationAfterAdd,
  adjustPaginationAfterDelete,
  calculateAdjustedFirst,
  getPaginatedItems,
  handlePageChange,
} from './paginationUtils';

describe('paginationUtils', () => {
  describe('calculateAdjustedFirst', () => {
    it('возвращает 0 если first >= totalRecords и totalRecords > 0', () => {
      expect(calculateAdjustedFirst(10, 5)).toBe(0);
      expect(calculateAdjustedFirst(5, 5)).toBe(0);
    });

    it('возвращает first если first < totalRecords', () => {
      expect(calculateAdjustedFirst(3, 10)).toBe(3);
      expect(calculateAdjustedFirst(0, 10)).toBe(0);
    });

    it('возвращает first если totalRecords = 0', () => {
      expect(calculateAdjustedFirst(5, 0)).toBe(5);
    });
  });

  describe('getPaginatedItems', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('возвращает корректный срез элементов', () => {
      expect(getPaginatedItems(items, 0, 3)).toEqual([1, 2, 3]);
      expect(getPaginatedItems(items, 3, 3)).toEqual([4, 5, 6]);
      expect(getPaginatedItems(items, 6, 3)).toEqual([7, 8, 9]);
    });

    it('корректирует first если он превышает количество элементов', () => {
      expect(getPaginatedItems(items, 15, 3)).toEqual([1, 2, 3]);
    });

    it('возвращает пустой массив для пустого входного массива', () => {
      expect(getPaginatedItems([], 0, 3)).toEqual([]);
    });
  });

  describe('handlePageChange', () => {
    beforeEach(() => {
      window.scrollTo = vi.fn();
    });

    it('возвращает новое состояние пагинации', () => {
      const result = handlePageChange({ first: 3, rows: 5 }, 10);
      expect(result).toEqual({ first: 3, rows: 5 });
    });

    it('сбрасывает first на 0 если он превышает totalRecords', () => {
      const result = handlePageChange({ first: 15, rows: 5 }, 10);
      expect(result).toEqual({ first: 0, rows: 5 });
    });

    it('вызывает window.scrollTo', () => {
      handlePageChange({ first: 3, rows: 5 }, 10);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('adjustPaginationAfterDelete', () => {
    it('уменьшает first на rows если currentFirst >= totalRecords - 1', () => {
      expect(adjustPaginationAfterDelete(10, 5, 11)).toBe(5);
      expect(adjustPaginationAfterDelete(10, 5, 10)).toBe(5);
    });

    it('возвращает currentFirst если условие не выполнено', () => {
      expect(adjustPaginationAfterDelete(5, 5, 20)).toBe(5);
      expect(adjustPaginationAfterDelete(0, 5, 10)).toBe(0);
    });

    it('не возвращает отрицательные значения', () => {
      expect(adjustPaginationAfterDelete(3, 5, 4)).toBe(0);
    });
  });

  describe('adjustPaginationAfterAdd', () => {
    it('возвращает 0 если currentFirst >= totalRecords', () => {
      expect(adjustPaginationAfterAdd(10, 5)).toBe(0);
      expect(adjustPaginationAfterAdd(10, 10)).toBe(0);
    });

    it('возвращает currentFirst если currentFirst < totalRecords', () => {
      expect(adjustPaginationAfterAdd(5, 10)).toBe(5);
      expect(adjustPaginationAfterAdd(0, 10)).toBe(0);
    });
  });
});
