import { Button } from 'primereact/button';
import { useTranslation } from 'react-i18next';
import { useWordsContext } from '../../hooks/useWordsContext';
import styles from './LanguageSettings.module.scss';

interface ImportExportButtonsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportClick: () => void;
  onImportChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onExportClick: () => void;
  onCheckDuplicatesClick: () => Promise<void>;
  onFixWordsLanguagesClick: () => Promise<void>;
}

const ImportExportButtons = ({
  fileInputRef,
  onImportClick,
  onImportChange,
  onExportClick,
  onCheckDuplicatesClick,
  onFixWordsLanguagesClick,
}: ImportExportButtonsProps) => {
  const { t } = useTranslation();
  const { words } = useWordsContext();

  return (
    <div className={styles.importExportSection}>
      <div className={styles.buttonGroup}>
        <Button
          icon="pi pi-upload"
          label={t('importWords')}
          onClick={onImportClick}
          severity="secondary"
          outlined
          className={styles.importButton}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={onImportChange}
          className={styles.hiddenFileInput}
        />
        <Button
          icon="pi pi-download"
          label={t('exportWords')}
          onClick={onExportClick}
          severity="secondary"
          outlined
          className={styles.exportButton}
          disabled={words.length === 0}
        />
        <Button
          icon="pi pi-trash"
          label={t('checkDuplicates')}
          onClick={onCheckDuplicatesClick}
          severity="secondary"
          outlined
          className={styles.checkDuplicatesButton}
          disabled={words.length === 0}
        />
        <Button
          icon="pi pi-refresh"
          label={t('fixWordsLanguages')}
          onClick={onFixWordsLanguagesClick}
          severity="secondary"
          outlined
          className={styles.fixWordsLanguagesButton}
          disabled={words.length === 0}
        />
      </div>
    </div>
  );
};

export default ImportExportButtons;
