import { useTranslation } from 'react-i18next';
import { getLangLabel } from '../../utils/languageUtils';
import { LANGS } from '../WordCard/constants';
import type { Lang } from '../WordCard/types';
import styles from './LanguageSettings.module.scss';

interface LanguageCheckboxListProps {
  selectedLangs: Lang[];
  onToggle: (lang: Lang) => void;
}

const LanguageCheckboxList = ({ selectedLangs, onToggle }: LanguageCheckboxListProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.languagesList}>
      {LANGS.map((lang) => (
        <label key={lang} className={styles.languageItem}>
          <input
            type="checkbox"
            checked={selectedLangs.includes(lang)}
            onChange={() => onToggle(lang)}
            disabled={selectedLangs.length <= 2 && selectedLangs.includes(lang)}
            className={styles.checkbox}
          />
          <span className={styles.label}>{getLangLabel(lang, t)}</span>
        </label>
      ))}
    </div>
  );
};

export default LanguageCheckboxList;
