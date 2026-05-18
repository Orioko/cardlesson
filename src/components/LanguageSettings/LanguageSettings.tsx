import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useTranslation } from 'react-i18next';
import { useLanguageSettings } from '../../hooks/useLanguageSettings';
import { useStatusMessages } from '../../hooks/useStatusMessages';
import { useWordsOperations } from '../../hooks/useWordsOperations';
import GradientButton from '../GradientButton';
import type { Lang } from '../WordCard/types';
import AppLanguageRadioList from './AppLanguageRadioList';
import FrontCardLanguageRadioList from './FrontCardLanguageRadioList';
import ImportExportButtons from './ImportExportButtons';
import LanguageCheckboxList from './LanguageCheckboxList';
import styles from './LanguageSettings.module.scss';
import StatusMessages from './StatusMessages';
import type { LanguageSettingsProps } from './types';

const LanguageSettingsContent = ({ onHide }: { onHide: () => void }) => {
  const { t } = useTranslation();
  const {
    selectedLangs,
    frontCardLang,
    appLanguage,
    setFrontCardLang,
    setAppLanguage,
    handleLangToggle: toggleLang,
    handleSave: saveLanguages,
  } = useLanguageSettings();
  const { error, statusMessage, statusSeverity, setError, setStatusMessage, clearMessages } =
    useStatusMessages();
  const {
    fileInputRef,
    handleExportWords,
    handleImportWords,
    handleImportButtonClick,
    handleCheckDuplicates,
    handleFixWordsLanguages,
  } = useWordsOperations({
    setError,
    setStatusMessage,
    clearMessages,
  });

  const handleLangToggle = (lang: Lang) => {
    clearMessages();
    const errorMessage = toggleLang(lang);
    if (errorMessage) {
      setError(errorMessage);
    }
  };

  const handleSave = () => {
    clearMessages();
    const success = saveLanguages();
    if (!success) {
      setError(t('minTwoLanguagesRequired'));
      return;
    }
    onHide();
  };

  const handleClose = () => {
    clearMessages();
    onHide();
  };

  return (
    <div className={styles.content}>
      <StatusMessages error={error} statusMessage={statusMessage} statusSeverity={statusSeverity} />

      <p className={styles.description}>{t('appLanguage')}</p>
      <AppLanguageRadioList appLanguage={appLanguage} onChange={setAppLanguage} />

      <p className={styles.description}>{t('selectLanguagesForCards')}</p>
      <LanguageCheckboxList selectedLangs={selectedLangs} onToggle={handleLangToggle} />

      <p className={styles.description}>{t('selectFrontCardLanguage')}</p>
      <FrontCardLanguageRadioList frontCardLang={frontCardLang} onChange={setFrontCardLang} />

      <ImportExportButtons
        fileInputRef={fileInputRef}
        onImportClick={handleImportButtonClick}
        onImportChange={handleImportWords}
        onExportClick={handleExportWords}
        onCheckDuplicatesClick={handleCheckDuplicates}
        onFixWordsLanguagesClick={handleFixWordsLanguages}
      />

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
