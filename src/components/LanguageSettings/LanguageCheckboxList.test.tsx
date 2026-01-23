import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Lang } from '../WordCard/types';
import LanguageCheckboxList from './LanguageCheckboxList';

vi.mock('../../utils/languageUtils', () => ({
  getLangLabel: (lang: Lang) => lang.toUpperCase(),
}));

describe('LanguageCheckboxList', () => {
  it('рендерит чекбоксы для всех языков', () => {
    const selectedLangs: Lang[] = ['ru', 'en'];
    render(<LanguageCheckboxList selectedLangs={selectedLangs} onToggle={vi.fn()} />);

    expect(screen.getByLabelText('RU')).toBeInTheDocument();
    expect(screen.getByLabelText('EN')).toBeInTheDocument();
    expect(screen.getByLabelText('KO')).toBeInTheDocument();
  });

  it('отмечает выбранные языки', () => {
    const selectedLangs: Lang[] = ['ru', 'en'];
    render(<LanguageCheckboxList selectedLangs={selectedLangs} onToggle={vi.fn()} />);

    expect(screen.getByLabelText('RU')).toBeChecked();
    expect(screen.getByLabelText('EN')).toBeChecked();
    expect(screen.getByLabelText('KO')).not.toBeChecked();
  });

  it('вызывает onToggle при клике на чекбокс', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const selectedLangs: Lang[] = ['ru', 'en'];

    render(<LanguageCheckboxList selectedLangs={selectedLangs} onToggle={onToggle} />);

    await user.click(screen.getByLabelText('KO'));
    expect(onToggle).toHaveBeenCalledWith('ko');
  });

  it('блокирует чекбокс когда выбрано только 2 языка', () => {
    const selectedLangs: Lang[] = ['ru', 'en'];
    render(<LanguageCheckboxList selectedLangs={selectedLangs} onToggle={vi.fn()} />);

    expect(screen.getByLabelText('RU')).toBeDisabled();
    expect(screen.getByLabelText('EN')).toBeDisabled();
    expect(screen.getByLabelText('KO')).not.toBeDisabled();
  });

  it('не блокирует чекбоксы когда выбрано больше 2 языков', () => {
    const selectedLangs: Lang[] = ['ru', 'en', 'ko'];
    render(<LanguageCheckboxList selectedLangs={selectedLangs} onToggle={vi.fn()} />);

    expect(screen.getByLabelText('RU')).not.toBeDisabled();
    expect(screen.getByLabelText('EN')).not.toBeDisabled();
    expect(screen.getByLabelText('KO')).not.toBeDisabled();
  });
});
