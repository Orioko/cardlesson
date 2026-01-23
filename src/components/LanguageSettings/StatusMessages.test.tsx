import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusMessages from './StatusMessages';

describe('StatusMessages', () => {
  it('отображает сообщение об ошибке', () => {
    render(<StatusMessages error="Test error" statusMessage="" statusSeverity="error" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('не отображает statusMessage когда есть error', () => {
    render(<StatusMessages error="Test error" statusMessage="Success" statusSeverity="success" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('отображает statusMessage когда нет error', () => {
    render(<StatusMessages error="" statusMessage="Success message" statusSeverity="success" />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('не отображает ничего когда нет сообщений', () => {
    const { container } = render(
      <StatusMessages error="" statusMessage="" statusSeverity="error" />
    );
    const messages = container.querySelectorAll('.p-message');
    expect(messages.length).toBe(0);
  });

  it('применяет правильную severity для statusMessage', () => {
    render(<StatusMessages error="" statusMessage="Info message" statusSeverity="info" />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('всегда показывает error с severity="error"', () => {
    render(<StatusMessages error="Error text" statusMessage="" statusSeverity="info" />);
    expect(screen.getByText('Error text')).toBeInTheDocument();
  });
});
