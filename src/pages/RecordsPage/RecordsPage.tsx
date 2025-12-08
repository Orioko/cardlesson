import { Button } from 'primereact/button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ConfirmDialog';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { TIMER_DURATIONS } from '../../components/TimerRecordsDialog/constants';
import { clearTimerRecords, getTimerRecords } from '../../utils/timerRecords';
import styles from './RecordsPage.module.scss';

const RecordsPage = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState(() => getTimerRecords());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const hasRecords = useMemo(() => Object.keys(records).length > 0, [records]);

  const handleClearRecords = useCallback(() => {
    clearTimerRecords();
    setRecords(getTimerRecords());
  }, []);

  const handleOpenConfirmDialog = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  return (
    <div className={styles.recordsContainer}>
      <Header title={t('records')} showNavigation={true} />
      <div className={styles.content}>
        {!hasRecords ? (
          <div className={styles.emptyState}>
            <i
              className="pi pi-sparkles"
              style={{ fontSize: '48px', color: '#667eea', marginBottom: '16px' }}
            ></i>
            <p>{t('noRecordsYet')}</p>
          </div>
        ) : (
          <>
            <div className={styles.headerSection}>
              <div className={styles.iconWrapper}>
                <i className="pi pi-sparkles" style={{ fontSize: '32px', color: '#667eea' }}></i>
              </div>
              <p className={styles.infoText}>{t('lastFiveRecords')}</p>
            </div>
            <div className={styles.recordsList}>
              {TIMER_DURATIONS.map((minutes) => {
                const recordsForDuration = records[minutes] || [];
                return (
                  <div key={minutes} className={styles.recordItem}>
                    <div className={styles.recordHeader}>
                      <span className={styles.recordMinutes}>
                        {minutes} {t('minute', { count: minutes })}
                      </span>
                    </div>
                    {recordsForDuration.length > 0 ? (
                      <div className={styles.recordDetails}>
                        {recordsForDuration.map((record, index) => (
                          <div key={index} className={styles.recordRow}>
                            <div className={styles.recordValue}>
                              <span className={styles.recordLabel}>#{index + 1}:</span>
                              <span className={styles.recordScore}>{record.wordsCompleted}</span>
                            </div>
                            <div className={styles.recordDate}>
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.recordEmpty}>{t('noRecord')}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.actions}>
              <Button
                label={t('clearRecords')}
                onClick={handleOpenConfirmDialog}
                severity="secondary"
                outlined
                className={styles.clearButton}
              />
            </div>
          </>
        )}
      </div>
      <div className={styles.footerContainer}>
        <div className={styles.mobileActions}>
          <Button
            icon="pi pi-trash"
            label={isMobile ? t('clear') : t('clearRecords')}
            onClick={handleOpenConfirmDialog}
            severity="secondary"
            outlined
            className={styles.mobileClearButton}
          />
        </div>
        <Footer />
      </div>
      <ConfirmDialog
        visible={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        onConfirm={handleClearRecords}
        header={t('confirmDelete')}
        message={t('confirmClearRecords')}
        confirmLabel={t('clearRecords')}
      />
    </div>
  );
};

export default RecordsPage;
