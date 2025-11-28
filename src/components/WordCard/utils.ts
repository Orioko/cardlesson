/**
 * Выбирает случайный элемент из массива.
 *
 * @template T - Тип элементов массива
 * @param {T[]} arr - Массив элементов
 * @returns {T | undefined} Случайно выбранный элемент или undefined, если массив пуст
 *
 * @example
 * const items = ['a', 'b', 'c'];
 * const random = pickRandom(items); // 'a', 'b' или 'c'
 */
export const pickRandom = <T>(arr: T[]): T | undefined => {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
};
