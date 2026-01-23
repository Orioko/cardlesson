import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoadingState from './LoadingState';

vi.mock('../Header', () => ({
  default: ({ title }: { title: string }) => <div data-testid="header">{title}</div>,
}));

vi.mock('../Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('LoadingState', () => {
  it('рендерит компонент с переданным title', () => {
    render(<LoadingState title="Loading Test" />);
    expect(screen.getByTestId('header')).toHaveTextContent('Loading Test');
  });

  it('отображает спиннер загрузки', () => {
    const { container } = render(<LoadingState title="Loading" />);
    const spinner = container.querySelector('.p-progress-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('рендерит Footer', () => {
    render(<LoadingState title="Loading" />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('применяет containerClassName если передан', () => {
    const { container } = render(
      <LoadingState title="Loading" containerClassName="custom-container" />
    );
    expect(container.querySelector('.custom-container')).toBeInTheDocument();
  });
});
