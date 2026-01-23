import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WhiteButton from './WhiteButton';

describe('WhiteButton', () => {
  it('рендерит кнопку с переданным label', () => {
    render(<WhiteButton onClick={vi.fn()} label="Test Button" />);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('вызывает onClick при клике', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<WhiteButton onClick={handleClick} label="Click Me" />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('отображает иконку если передана', () => {
    const { container } = render(<WhiteButton onClick={vi.fn()} label="Test" icon="pi pi-check" />);
    const icon = container.querySelector('.pi-check');
    expect(icon).toBeInTheDocument();
  });

  it('применяет disabled состояние', () => {
    render(<WhiteButton onClick={vi.fn()} label="Test" disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('не вызывает onClick когда disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<WhiteButton onClick={handleClick} label="Click Me" disabled={true} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('применяет дополнительный className', () => {
    const { container } = render(
      <WhiteButton onClick={vi.fn()} label="Test" className="custom-class" />
    );
    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });
});
