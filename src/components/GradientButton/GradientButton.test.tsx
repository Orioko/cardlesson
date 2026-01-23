import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GradientButton from './GradientButton';

describe('GradientButton', () => {
  it('рендерит кнопку с переданным label', () => {
    render(<GradientButton onClick={vi.fn()} label="Test Button" />);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('вызывает onClick при клике', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<GradientButton onClick={handleClick} label="Click Me" />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('отображает иконку если передана', () => {
    const { container } = render(
      <GradientButton onClick={vi.fn()} label="Test" icon="pi pi-check" />
    );
    const icon = container.querySelector('.pi-check');
    expect(icon).toBeInTheDocument();
  });

  it('применяет дополнительный className', () => {
    const { container } = render(
      <GradientButton onClick={vi.fn()} label="Test" className="custom-class" />
    );
    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });
});
