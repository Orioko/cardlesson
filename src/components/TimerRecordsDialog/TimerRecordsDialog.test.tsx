import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TimerRecordsDialog from './TimerRecordsDialog';

const mockGetTimerRecords = vi.fn();
const mockClearTimerRecords = vi.fn();

vi.mock('../../utils/timerRecords', () => ({
  getTimerRecords: () => mockGetTimerRecords(),
  clearTimerRecords: () => mockClearTimerRecords(),
}));

describe('TimerRecordsDialog', () => {
  const defaultProps = {
    visible: true,
    onHide: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('рендерит диалог когда visible=true', () => {
    mockGetTimerRecords.mockReturnValue({});
    render(<TimerRecordsDialog {...defaultProps} />);
    expect(screen.getByText('records')).toBeInTheDocument();
  });

  it('показывает сообщение когда нет рекордов', () => {
    mockGetTimerRecords.mockReturnValue({});
    render(<TimerRecordsDialog {...defaultProps} />);
    expect(screen.getByText('noRecordsYet')).toBeInTheDocument();
  });

  it('показывает список рекордов когда они есть', () => {
    mockGetTimerRecords.mockReturnValue({
      1: [{ wordsCompleted: 10, date: '2024-01-01T00:00:00.000Z' }],
      3: [{ wordsCompleted: 25, date: '2024-01-02T00:00:00.000Z' }],
    });

    render(<TimerRecordsDialog {...defaultProps} />);

    expect(screen.getByText('lastFiveRecords')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('отображает кнопку очистки рекордов когда они есть', () => {
    mockGetTimerRecords.mockReturnValue({
      1: [{ wordsCompleted: 10, date: '2024-01-01T00:00:00.000Z' }],
    });

    render(<TimerRecordsDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'clearRecords' })).toBeInTheDocument();
  });

  it('очищает рекорды при подтверждении', async () => {
    const user = userEvent.setup();
    mockGetTimerRecords.mockReturnValue({
      1: [{ wordsCompleted: 10, date: '2024-01-01T00:00:00.000Z' }],
    });

    render(<TimerRecordsDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'clearRecords' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearTimerRecords).toHaveBeenCalled();
    expect(defaultProps.onHide).toHaveBeenCalled();
  });

  it('не очищает рекорды при отмене', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);
    mockGetTimerRecords.mockReturnValue({
      1: [{ wordsCompleted: 10, date: '2024-01-01T00:00:00.000Z' }],
    });

    render(<TimerRecordsDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'clearRecords' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockClearTimerRecords).not.toHaveBeenCalled();
    expect(defaultProps.onHide).not.toHaveBeenCalled();
  });

  it('не загружает рекорды когда visible=false', () => {
    mockGetTimerRecords.mockReturnValue({});
    render(<TimerRecordsDialog {...defaultProps} visible={false} />);
    expect(mockGetTimerRecords).not.toHaveBeenCalled();
  });
});
