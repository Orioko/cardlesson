import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSelectedLanguages, saveSelectedLanguages } from '../../utils/selectedLanguagesStorage';
import GradientButton from '../GradientButton';
import { LANGS } from '../WordCard/constants';
import type { Lang } from '../WordCard/types';
import styles from './LanguageSettings.module.scss';
import type { LanguageSettingsProps } from './types';

const LanguageSettingsContent = ({ onHide }: { onHide: () => void }) => {
  const { t } = useTranslation();
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(() => getSelectedLanguages());
  const [error, setError] = useState('');

  const handleLangToggle = (lang: Lang) => {
    setError('');
    if (selectedLangs.includes(lang)) {
      if (selectedLangs.length <= 2) {
        setError(t('minTwoLanguagesRequired'));
        return;
      }
      setSelectedLangs(selectedLangs.filter((l) => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const handleSave = () => {
    try {
      if (selectedLangs.length < 2) {
        setError(t('minTwoLanguagesRequired'));
        return;
      }

      saveSelectedLanguages(selectedLangs);
      onHide();
    } catch {
      setError(t('minTwoLanguagesRequired'));
    }
  };

  const handleClose = () => {
    setError('');
    onHide();
  };

  const getLangLabel = (lang: Lang): string => {
    const labels: Record<Lang, string> = {
      ru: t('russian'),
      en: t('english'),
      ko: t('korean'),
    };
    return labels[lang];
  };

  return (
    <div className={styles.content}>
      {error && <Message severity="error" text={error} className={styles.message} />}

      <p className={styles.description}>{t('selectLanguagesForCards')}</p>

      <div className={styles.languagesList}>
        {LANGS.map((lang) => (
          <label key={lang} className={styles.languageItem}>
            <input
              type="checkbox"
              checked={selectedLangs.includes(lang)}
              onChange={() => handleLangToggle(lang)}
              disabled={selectedLangs.length <= 2 && selectedLangs.includes(lang)}
              className={styles.checkbox}
            />
            <span className={styles.label}>{getLangLabel(lang)}</span>
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <Button label={t('cancel')} onClick={handleClose} severity="secondary" outlined />
        <GradientButton label={t('save')} onClick={handleSave} className={styles.saveButton} />
      </div>
    </div>
  );
};

const LanguageSettings = ({ visible, onHide }: LanguageSettingsProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      key={visible ? 'open' : 'closed'}
      visible={visible}
      onHide={onHide}
      header={t('languageSettings')}
      className={styles.dialog}
      modal
      dismissableMask
    >
      {visible && <LanguageSettingsContent onHide={onHide} />}
    </Dialog>
  );
};

export default LanguageSettings;
