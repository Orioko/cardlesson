import { Dialog } from 'primereact/dialog';
import { useTranslation } from 'react-i18next';
import GradientButton from '../GradientButton';
import WhiteButton from '../WhiteButton';
import styles from './ConfirmDialog.module.scss';
import type { ConfirmDialogProps } from './types';

const ConfirmDialog = ({
  visible,
  onHide,
  onConfirm,
  header,
  message,
  confirmLabel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header || t('confirmDelete')}
      modal
      className={styles.dialog}
    >
      <div className={styles.content}>
        <p>{message || t('confirmDeleteMessage')}</p>
        <div className={styles.actions}>
          <WhiteButton label={t('cancel')} onClick={onHide} />
          <GradientButton label={confirmLabel || t('delete')} onClick={handleConfirm} />
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
