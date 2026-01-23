import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from './EmptyState';

vi.mock('../Header', () => ({
  default: ({ title }: { title: string }) => <div data-testid="header">{title}</div>,
}));

vi.mock('../Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('EmptyState', () => {
  it('рендерит компонент с переданным title', () => {
    render(<EmptyState title="Empty Test" />);
    expect(screen.getByTestId('header')).toHaveTextContent('Empty Test');
  });

  it('отображает переданное сообщение', () => {
    render(<EmptyState title="Empty" message="Custom empty message" />);
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('отображает дефолтное сообщение если не передано', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText('noWords')).toBeInTheDocument();
  });

  it('рендерит Footer', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('применяет containerClassName если передан', () => {
    const { container } = render(
      <EmptyState title="Empty" containerClassName="custom-container" />
    );
    expect(container.querySelector('.custom-container')).toBeInTheDocument();
  });
});
