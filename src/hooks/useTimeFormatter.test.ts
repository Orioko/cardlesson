import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTimeFormatter } from './useTimeFormatter';

describe('useTimeFormatter', () => {
  it('форматирует секунды в mm:ss формат', () => {
    const { result } = renderHook(() => useTimeFormatter());

    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(5)).toBe('00:05');
    expect(result.current.formatTime(59)).toBe('00:59');
    expect(result.current.formatTime(60)).toBe('01:00');
    expect(result.current.formatTime(125)).toBe('02:05');
    expect(result.current.formatTime(3599)).toBe('59:59');
  });

  it('добавляет ведущий ноль к минутам и секундам', () => {
    const { result } = renderHook(() => useTimeFormatter());

    expect(result.current.formatTime(9)).toBe('00:09');
    expect(result.current.formatTime(69)).toBe('01:09');
  });

  it('корректно обрабатывает большие значения', () => {
    const { result } = renderHook(() => useTimeFormatter());

    expect(result.current.formatTime(3600)).toBe('60:00');
    expect(result.current.formatTime(7200)).toBe('120:00');
  });
});
