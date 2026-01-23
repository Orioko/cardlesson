import { describe, expect, it } from 'vitest';
import type { Word } from '../types/word';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  handleWordUpdate,
  initializeRepeatState,
  resetRepeatState,
  shuffleArray,
} from './repeatUtils';

const createMockWord = (id: string): Word => ({
  id,
  ru: `ru-${id}`,
  en: `en-${id}`,
  ko: `ko-${id}`,
  translations: {
    ru: `ru-${id}`,
    en: `en-${id}`,
    ko: `ko-${id}`,
  },
});

describe('repeatUtils', () => {
  describe('shuffleArray', () => {
    it('возвращает массив той же длины', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it('содержит все элементы оригинального массива', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('не изменяет оригинальный массив', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('initializeRepeatState', () => {
    it('инициализирует состояние с корректными значениями', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);

      expect(state.currentIndex).toBe(0);
      expect(state.isCompleted).toBe(false);
      expect(state.correctWords.size).toBe(0);
      expect(state.incorrectCount).toBe(0);
      expect(state.wordsQueue).toHaveLength(words.length);
    });

    it('возвращает пустую очередь для пустого массива', () => {
      const state = initializeRepeatState([]);
      expect(state.wordsQueue).toHaveLength(0);
    });
  });

  describe('handleCorrectAnswer', () => {
    it('добавляет слово в correctWords', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);
      const currentWord = state.wordsQueue[0];

      const result = handleCorrectAnswer(currentWord, state, words);

      expect(result.newState.correctWords.has(currentWord.id)).toBe(true);
    });

    it('удаляет слово из очереди', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);
      const currentWord = state.wordsQueue[0];

      const result = handleCorrectAnswer(currentWord, state, words);

      expect(result.newState.wordsQueue).toHaveLength(1);
      expect(result.newState.wordsQueue.find((w) => w.id === currentWord.id)).toBeUndefined();
    });

    it('завершает игру когда все слова угаданы', () => {
      const words = [createMockWord('1')];
      const state = initializeRepeatState(words);
      const currentWord = state.wordsQueue[0];

      const result = handleCorrectAnswer(currentWord, state, words);

      expect(result.shouldComplete).toBe(true);
      expect(result.newState.isCompleted).toBe(true);
    });

    it('возвращает текущее состояние если currentWord null', () => {
      const words = [createMockWord('1')];
      const state = initializeRepeatState(words);

      const result = handleCorrectAnswer(null, state, words);

      expect(result.newState).toEqual(state);
      expect(result.shouldComplete).toBe(false);
    });
  });

  describe('handleIncorrectAnswer', () => {
    it('увеличивает incorrectCount', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);
      const currentWord = state.wordsQueue[0];

      const result = handleIncorrectAnswer(currentWord, state);

      expect(result.newState.incorrectCount).toBe(state.incorrectCount + 1);
    });

    it('перемещает слово в конец очереди', () => {
      const words = [createMockWord('1'), createMockWord('2'), createMockWord('3')];
      const state = initializeRepeatState(words);
      const currentWord = state.wordsQueue[0];

      const result = handleIncorrectAnswer(currentWord, state);

      expect(result.newState.wordsQueue[result.newState.wordsQueue.length - 1].id).toBe(
        currentWord.id
      );
    });

    it('возвращает текущее состояние если currentWord null', () => {
      const words = [createMockWord('1')];
      const state = initializeRepeatState(words);

      const result = handleIncorrectAnswer(null, state);

      expect(result.newState).toEqual(state);
    });
  });

  describe('resetRepeatState', () => {
    it('сбрасывает состояние', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const newState = resetRepeatState(words);

      expect(newState.currentIndex).toBe(0);
      expect(newState.isCompleted).toBe(false);
      expect(newState.correctWords.size).toBe(0);
      expect(newState.incorrectCount).toBe(0);
    });
  });

  describe('handleWordUpdate', () => {
    it('обновляет слово в очереди', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);
      const updatedWord = { ...words[0], ru: 'updated' };

      const result = handleWordUpdate(words[0].id, updatedWord, state);

      const foundWord = result.newState.wordsQueue.find((w) => w.id === words[0].id);
      expect(foundWord?.ru).toBe('updated');
    });

    it('увеличивает индекс', () => {
      const words = [createMockWord('1'), createMockWord('2')];
      const state = initializeRepeatState(words);
      const updatedWord = words[0];

      const result = handleWordUpdate(words[0].id, updatedWord, state);

      expect(result.newState.currentIndex).toBe(1);
    });
  });
});
