import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWordsContext } from '../../hooks/useWordsContext';
import { checkAndRemoveDuplicates } from '../../utils/cleanupDuplicates';
import { getSelectedLanguages, saveSelectedLanguages } from '../../utils/selectedLanguagesStorage';
import { exportWordsToJson, importWordsFromFile } from '../../utils/wordsImportExport';
import GradientButton from '../GradientButton';
import { LANGS } from '../WordCard/constants';
import type { Lang } from '../WordCard/types';
import styles from './LanguageSettings.module.scss';
import type { LanguageSettingsProps } from './types';

const LanguageSettingsContent = ({ onHide }: { onHide: () => void }) => {
  const { t } = useTranslation();
  const { words, refreshWords } = useWordsContext();
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(() => getSelectedLanguages());
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusSeverity, setStatusSeverity] = useState<'error' | 'success' | 'info'>('error');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLangToggle = (lang: Lang) => {
    setError('');
    setStatusMessage('');
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
    setStatusMessage('');
    onHide();
  };

  const handleExportWords = () => {
    try {
      exportWordsToJson(words);
    } catch {
      setError(t('errorExportingWords'));
    }
  };

  const handleImportWords = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setStatusMessage('');
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const result = await importWordsFromFile(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (result.addedCount > 0 || result.duplicatesCount > 0) {
        await refreshWords();
        const messages: string[] = [];

        if (result.addedCount > 0) {
          messages.push(
            t('wordsImported', { count: result.addedCount }) ||
              `Добавлено слов: ${result.addedCount}`
          );
        }

        if (result.duplicatesCount > 0) {
          messages.push(
            t('duplicatesSkipped', { count: result.duplicatesCount }) ||
              `Пропущено дубликатов: ${result.duplicatesCount}`
          );
        }

        if (result.errorCount > 0) {
          messages.push(
            t('errorsDuringImport', { count: result.errorCount }) || `Ошибок: ${result.errorCount}`
          );
        }

        if (messages.length > 0) {
          setError(messages.join('. '));
        } else {
          setError('');
        }
      } else {
        setError(t('noWordsImported') || 'Не удалось импортировать слова');
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Invalid file format: expected array of words'
      ) {
        setError(t('invalidFileFormat'));
      } else {
        setError(t('errorImportingWords') || 'Ошибка при импорте слов');
      }
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCheckDuplicates = async () => {
    setError('');
    setStatusMessage('');
    try {
      const result = await checkAndRemoveDuplicates();
      await refreshWords();

      if (result.duplicatesCount > 0) {
        setStatusMessage(
          t('duplicatesRemoved', { count: result.duplicatesCount }) ||
            `Удалено дубликатов: ${result.duplicatesCount}`
        );
        setStatusSeverity('success');
      } else {
        setStatusMessage(t('noDuplicatesFound') || 'Дубликаты не найдены');
        setStatusSeverity('info');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not authenticated') {
        setError(t('userNotAuthenticated'));
        setStatusSeverity('error');
      } else {
        setError(t('errorCheckingDuplicates') || 'Ошибка при проверке дубликатов');
        setStatusSeverity('error');
      }
    }
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
      {statusMessage && !error && (
        <Message severity={statusSeverity} text={statusMessage} className={styles.message} />
      )}

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

      <div className={styles.importExportSection}>
        <div className={styles.buttonGroup}>
          <Button
            icon="pi pi-upload"
            label={t('importWords')}
            onClick={handleImportButtonClick}
            severity="secondary"
            outlined
            className={styles.importButton}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportWords}
            className={styles.hiddenFileInput}
          />
          <Button
            icon="pi pi-download"
            label={t('exportWords')}
            onClick={handleExportWords}
            severity="secondary"
            outlined
            className={styles.exportButton}
            disabled={words.length === 0}
          />
          <Button
            icon="pi pi-trash"
            label={t('checkDuplicates')}
            onClick={handleCheckDuplicates}
            severity="secondary"
            outlined
            className={styles.checkDuplicatesButton}
            disabled={words.length === 0}
          />
        </div>
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
