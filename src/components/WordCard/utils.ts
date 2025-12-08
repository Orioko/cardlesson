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

/**
 * Выбирает детерминированный элемент из массива на основе строки-ключа.
 * Для одного и того же ключа всегда возвращает один и тот же элемент.
 *
 * @template T - Тип элементов массива
 * @param {T[]} arr - Массив элементов
 * @param {string} key - Ключ для детерминированного выбора
 * @returns {T | undefined} Выбранный элемент или undefined, если массив пуст
 *
 * @example
 * const items = ['a', 'b', 'c'];
 * const selected = pickDeterministic(items, 'word-123'); // всегда один и тот же для 'word-123'
 */
export const pickDeterministic = <T>(arr: T[], key: string): T | undefined => {
  if (arr.length === 0) {
    return undefined;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return arr[Math.abs(hash) % arr.length];
};
