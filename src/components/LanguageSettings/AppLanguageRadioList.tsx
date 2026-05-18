import { useTranslation } from 'react-i18next';
import { getLangLabel } from '../../utils/languageUtils';
import { LANGS } from '../WordCard/constants';
import type { Lang } from '../WordCard/types';
import styles from './LanguageSettings.module.scss';

interface AppLanguageRadioListProps {
  appLanguage: Lang;
  onChange: (lang: Lang) => void;
}

const AppLanguageRadioList = ({ appLanguage, onChange }: AppLanguageRadioListProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.languagesList}>
      {LANGS.map((lang) => (
        <label key={lang} className={styles.languageItem}>
          <input
            type="radio"
            name="appLanguage"
            checked={appLanguage === lang}
            onChange={() => onChange(lang)}
            className={styles.radio}
          />
          <span className={styles.label}>{getLangLabel(lang, t)}</span>
        </label>
      ))}
    </div>
  );
};

export default AppLanguageRadioList;
