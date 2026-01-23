import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WordData } from './types';
import WordCard from './WordCard';

vi.mock('../../utils/frontCardLanguageStorage', () => ({
  getFrontCardLanguage: () => null,
}));

vi.mock('./utils', () => ({
  getFilledLanguages: (wordData: WordData) => {
    const langs: Array<'ru' | 'en' | 'ko'> = [];
    if (wordData.ru) langs.push('ru');
    if (wordData.en) langs.push('en');
    if (wordData.ko) langs.push('ko');
    return langs;
  },
  getFrontLanguage: () => 'en',
}));

describe('WordCard', () => {
  const mockWordData: WordData = {
    ru: 'привет',
    en: 'hello',
    ko: '안녕하세요',
    translations: {
      ru: 'привет',
      en: 'hello',
      ko: '안녕하세요',
    },
  };

  it('рендерит карточку с переданными данными', () => {
    const { container } = render(<WordCard wordId="1" wordData={mockWordData} />);
    const frontCard = container.querySelector('[class*="cardFront"]');
    expect(frontCard).toBeInTheDocument();
    expect(frontCard).toHaveTextContent('hello');
  });

  it('переворачивает карточку при клике', async () => {
    const user = userEvent.setup();
    const { container } = render(<WordCard wordId="1" wordData={mockWordData} />);

    const card = container.querySelector('[role="button"]');
    expect(card).toBeInTheDocument();

    const cardInner = container.querySelector('[class*="cardInner"]');
    const initialClass = cardInner?.className || '';
    expect(initialClass).not.toContain('flipped');

    await user.click(card!);

    const updatedClass = cardInner?.className || '';
    expect(updatedClass).toContain('flipped');
  });

  it('показывает кнопки действий когда showActions=true', () => {
    render(
      <WordCard
        wordId="1"
        wordData={mockWordData}
        showActions={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByLabelText('edit')).toBeInTheDocument();
    expect(screen.getByLabelText('delete')).toBeInTheDocument();
  });

  it('не показывает кнопки действий когда showActions=false', () => {
    render(<WordCard wordId="1" wordData={mockWordData} showActions={false} />);

    expect(screen.queryByLabelText('edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('delete')).not.toBeInTheDocument();
  });

  it('вызывает onEdit при клике на кнопку редактирования', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <WordCard
        wordId="1"
        wordData={mockWordData}
        showActions={true}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText('edit'));
    expect(onEdit).toHaveBeenCalledWith('1', mockWordData);
  });

  it('вызывает onDelete при клике на кнопку удаления', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <WordCard
        wordId="1"
        wordData={mockWordData}
        showActions={true}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByLabelText('delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('переворачивает карточку при нажатии Enter', async () => {
    const user = userEvent.setup();
    const { container } = render(<WordCard wordId="1" wordData={mockWordData} />);

    const card = screen.getByRole('button');
    const cardInner = container.querySelector('[class*="cardInner"]');

    card.focus();
    await user.keyboard('{Enter}');

    const updatedClass = cardInner?.className || '';
    expect(updatedClass).toContain('flipped');
  });

  it('переворачивает карточку при нажатии Space', async () => {
    const user = userEvent.setup();
    const { container } = render(<WordCard wordId="1" wordData={mockWordData} />);

    const card = screen.getByRole('button');
    const cardInner = container.querySelector('[class*="cardInner"]');

    card.focus();
    await user.keyboard(' ');

    const updatedClass = cardInner?.className || '';
    expect(updatedClass).toContain('flipped');
  });

  it('отображает переводы на обратной стороне карточки', async () => {
    const user = userEvent.setup();
    const { container } = render(<WordCard wordId="1" wordData={mockWordData} />);

    const card = container.querySelector('[role="button"]');
    await user.click(card!);

    expect(screen.getByText('RU:')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.getByText('EN:')).toBeInTheDocument();
    expect(screen.getByText('KO:')).toBeInTheDocument();
  });
});
