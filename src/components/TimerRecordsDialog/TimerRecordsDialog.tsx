import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { clearTimerRecords, getTimerRecords } from '../../utils/timerRecords';
import { TIMER_DURATIONS } from './constants';
import styles from './TimerRecordsDialog.module.scss';
import type { TimerRecordsDialogProps } from './types';

const TimerRecordsDialog = ({ visible, onHide }: TimerRecordsDialogProps) => {
  const { t } = useTranslation();

  const records = useMemo(() => {
    return visible ? getTimerRecords() : {};
  }, [visible]);

  const hasRecords = useMemo(() => Object.keys(records).length > 0, [records]);

  const handleClearRecords = useCallback(() => {
    if (
      window.confirm(t('confirmClearRecords') || 'Вы уверены, что хотите очистить все рекорды?')
    ) {
      clearTimerRecords();
      onHide();
    }
  }, [t, onHide]);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t('records')}
      className={styles.dialog}
      modal
      dismissableMask
    >
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
                onClick={handleClearRecords}
                severity="danger"
                outlined
                className={styles.clearButton}
              />
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default TimerRecordsDialog;
