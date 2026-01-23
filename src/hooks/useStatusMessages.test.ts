import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStatusMessages } from './useStatusMessages';

describe('useStatusMessages', () => {
  it('инициализируется с пустыми значениями', () => {
    const { result } = renderHook(() => useStatusMessages());

    expect(result.current.error).toBe('');
    expect(result.current.statusMessage).toBe('');
    expect(result.current.statusSeverity).toBe('error');
  });

  it('устанавливает сообщение об ошибке', () => {
    const { result } = renderHook(() => useStatusMessages());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('устанавливает статусное сообщение с дефолтной severity', () => {
    const { result } = renderHook(() => useStatusMessages());

    act(() => {
      result.current.setStatusMessage('Success message');
    });

    expect(result.current.statusMessage).toBe('Success message');
    expect(result.current.statusSeverity).toBe('success');
  });

  it('устанавливает статусное сообщение с кастомной severity', () => {
    const { result } = renderHook(() => useStatusMessages());

    act(() => {
      result.current.setStatusMessage('Info message', 'info');
    });

    expect(result.current.statusMessage).toBe('Info message');
    expect(result.current.statusSeverity).toBe('info');
  });

  it('очищает все сообщения', () => {
    const { result } = renderHook(() => useStatusMessages());

    act(() => {
      result.current.setError('Error');
      result.current.setStatusMessage('Message');
    });

    expect(result.current.error).toBe('Error');
    expect(result.current.statusMessage).toBe('Message');

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.error).toBe('');
    expect(result.current.statusMessage).toBe('');
  });
});
