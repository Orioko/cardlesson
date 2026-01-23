import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Footer from './Footer';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../utils/localAuth', () => ({
  logout: () => mockLogout(),
}));

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('рендерит кнопку выхода', () => {
    render(<Footer />);
    expect(screen.getByLabelText('exitAccount')).toBeInTheDocument();
  });

  it('открывает диалог подтверждения при клике на кнопку выхода', async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await user.click(screen.getByLabelText('exitAccount'));
    expect(screen.getByText('confirmExit')).toBeInTheDocument();
    expect(screen.getByText('confirmExitMessage')).toBeInTheDocument();
  });

  it('закрывает диалог при клике на отмену', async () => {
    const user = userEvent.setup();
    const { container } = render(<Footer />);

    await user.click(screen.getByLabelText('exitAccount'));
    expect(screen.getByText('confirmExit')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'cancel' }));

    const dialog = container.querySelector('.p-dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('выполняет logout и редирект при подтверждении выхода', async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await user.click(screen.getByLabelText('exitAccount'));

    const exitButtons = screen.getAllByRole('button', { name: 'ExitUser' });
    const confirmButton = exitButtons[exitButtons.length - 1];
    await user.click(confirmButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('показывает короткий текст на мобильных устройствах', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<Footer />);

    await vi.waitFor(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByLabelText('ExitUser')).toBeInTheDocument();
  });
});
