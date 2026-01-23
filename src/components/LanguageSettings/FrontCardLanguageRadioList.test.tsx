import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '../WordCard/types';
import FrontCardLanguageRadioList from './FrontCardLanguageRadioList';

vi.mock('../../utils/languageUtils', () => ({
  getLangLabel: (lang: Lang) => lang.toUpperCase(),
}));

describe('FrontCardLanguageRadioList', () => {
  it('рендерит радиокнопки для всех языков плюс "random"', () => {
    render(<FrontCardLanguageRadioList frontCardLang={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText('random')).toBeInTheDocument();
    expect(screen.getByLabelText('RU')).toBeInTheDocument();
    expect(screen.getByLabelText('EN')).toBeInTheDocument();
    expect(screen.getByLabelText('KO')).toBeInTheDocument();
  });

  it('отмечает "random" когда frontCardLang=null', () => {
    render(<FrontCardLanguageRadioList frontCardLang={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText('random')).toBeChecked();
    expect(screen.getByLabelText('RU')).not.toBeChecked();
    expect(screen.getByLabelText('EN')).not.toBeChecked();
    expect(screen.getByLabelText('KO')).not.toBeChecked();
  });

  it('отмечает выбранный язык', () => {
    render(<FrontCardLanguageRadioList frontCardLang="en" onChange={vi.fn()} />);

    expect(screen.getByLabelText('random')).not.toBeChecked();
    expect(screen.getByLabelText('EN')).toBeChecked();
    expect(screen.getByLabelText('RU')).not.toBeChecked();
    expect(screen.getByLabelText('KO')).not.toBeChecked();
  });

  it('вызывает onChange с null при выборе "random"', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<FrontCardLanguageRadioList frontCardLang="ru" onChange={onChange} />);

    await user.click(screen.getByLabelText('random'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('вызывает onChange с языком при выборе языка', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<FrontCardLanguageRadioList frontCardLang={null} onChange={onChange} />);

    await user.click(screen.getByLabelText('KO'));
    expect(onChange).toHaveBeenCalledWith('ko');
  });
});
