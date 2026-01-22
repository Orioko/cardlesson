import { useTranslation } from 'react-i18next';
import { getLangLabel } from '../../utils/languageUtils';
import { LANGS } from '../WordCard/constants';
import type { Lang } from '../WordCard/types';
import styles from './LanguageSettings.module.scss';

interface FrontCardLanguageRadioListProps {
  frontCardLang: Lang | null;
  onChange: (lang: Lang | null) => void;
}

const FrontCardLanguageRadioList = ({
  frontCardLang,
  onChange,
}: FrontCardLanguageRadioListProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.languagesList}>
      <label className={styles.languageItem}>
        <input
          type="radio"
          name="frontCardLanguage"
          checked={frontCardLang === null}
          onChange={() => onChange(null)}
          className={styles.radio}
        />
        <span className={styles.label}>{t('random')}</span>
      </label>
      {LANGS.map((lang) => (
        <label key={lang} className={styles.languageItem}>
          <input
            type="radio"
            name="frontCardLanguage"
            checked={frontCardLang === lang}
            onChange={() => onChange(lang)}
            className={styles.radio}
          />
          <span className={styles.label}>{getLangLabel(lang, t)}</span>
        </label>
      ))}
    </div>
  );
};

export default FrontCardLanguageRadioList;
