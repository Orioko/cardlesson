import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWordsContext } from '../../hooks/useWordsContext';
import { getCurrentUser, onAuthChange } from '../../utils/localAuth';
import { BACKUP_REMINDER_EVENT, isBackupDue, snoozeBackupReminder } from '../../utils/wordsBackup';
import { exportWordsToJson } from '../../utils/wordsImportExport';
import GradientButton from '../GradientButton';
import styles from './BackupReminder.module.scss';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

// BackupReminder раз в неделю предлагает скачать файл со словами, если это включено в настройках.
const BackupReminder = () => {
  const { t } = useTranslation();
  const { words, loading } = useWordsContext();
  const [due, setDue] = useState(false);

  useEffect(() => {
    const refresh = () => setDue(Boolean(getCurrentUser()) && isBackupDue());
    const unsubscribe = onAuthChange(refresh);
    window.addEventListener(BACKUP_REMINDER_EVENT, refresh);
    const timer = window.setInterval(refresh, CHECK_INTERVAL_MS);
    return () => {
      unsubscribe();
      window.removeEventListener(BACKUP_REMINDER_EVENT, refresh);
      window.clearInterval(timer);
    };
  }, []);

  // Пустой словарь сохранять незачем.
  const visible = due && !loading && words.length > 0;

  return (
    <Dialog
      visible={visible}
      onHide={snoozeBackupReminder}
      header={t('backupReminderTitle')}
      className={styles.dialog}
      modal
    >
      <div className={styles.content}>
        <p className={styles.text}>{t('backupReminderText', { count: words.length })}</p>
        <div className={styles.actions}>
          <Button
            label={t('backupLater')}
            severity="secondary"
            outlined
            onClick={snoozeBackupReminder}
          />
          <GradientButton
            icon="pi pi-download"
            label={t('backupDownload')}
            onClick={() => exportWordsToJson(words)}
          />
        </div>
        <p className={styles.hint}>{t('backupDisableHint')}</p>
      </div>
    </Dialog>
  );
};

export default BackupReminder;
