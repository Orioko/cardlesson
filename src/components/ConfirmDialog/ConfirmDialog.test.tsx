import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    onHide: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит диалог когда visible=true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('confirmDelete')).toBeInTheDocument();
    expect(screen.getByText('confirmDeleteMessage')).toBeInTheDocument();
  });

  it('не рендерит диалог когда visible=false', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} visible={false} />);
    const dialog = container.querySelector('.p-dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('отображает кастомный header', () => {
    render(<ConfirmDialog {...defaultProps} header="Custom Header" />);
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  it('отображает кастомное message', () => {
    render(<ConfirmDialog {...defaultProps} message="Custom Message" />);
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('отображает кастомный confirmLabel', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Custom Confirm" />);
    expect(screen.getByRole('button', { name: 'Custom Confirm' })).toBeInTheDocument();
  });

  it('вызывает onHide при клике на Cancel', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(defaultProps.onHide).toHaveBeenCalledTimes(1);
  });

  it('вызывает onConfirm и onHide при клике на Confirm', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'delete' }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onHide).toHaveBeenCalledTimes(1);
  });

  it('рендерит кнопки Cancel и Delete по умолчанию', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'delete' })).toBeInTheDocument();
  });
});
