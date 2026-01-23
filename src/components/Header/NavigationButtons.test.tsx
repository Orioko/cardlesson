import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NavigationButtons from './NavigationButtons';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NavigationButtons', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('рендерит кнопки для dictionary страницы', () => {
    render(<NavigationButtons currentPath="/" />);
    expect(screen.getByRole('button', { name: 'repeat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'timer' })).toBeInTheDocument();
  });

  it('рендерит кнопки для repeat страницы', () => {
    render(<NavigationButtons currentPath="/repeat" />);
    expect(screen.getByRole('button', { name: 'timer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'myDictionary' })).toBeInTheDocument();
  });

  it('рендерит кнопки для timer страницы', () => {
    render(<NavigationButtons currentPath="/timer" />);
    expect(screen.getByRole('button', { name: 'repeat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'myDictionary' })).toBeInTheDocument();
  });

  it('рендерит все кнопки для records страницы', () => {
    render(<NavigationButtons currentPath="/records" />);
    expect(screen.getByRole('button', { name: 'repeat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'timer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'myDictionary' })).toBeInTheDocument();
  });

  it('не рендерит кнопки для неизвестного пути', () => {
    const { container } = render(<NavigationButtons currentPath="/unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it('навигирует при клике на кнопку', async () => {
    const user = userEvent.setup();
    render(<NavigationButtons currentPath="/" />);

    await user.click(screen.getByRole('button', { name: 'repeat' }));
    expect(mockNavigate).toHaveBeenCalledWith('/repeat');
  });
});
