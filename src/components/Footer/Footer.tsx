import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../utils/localAuth';
import GradientButton from '../GradientButton';
import WhiteButton from '../WhiteButton';
import styles from './Footer.module.scss';

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);
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

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  return (
    <>
      <footer className={styles.footer}>
        <GradientButton
          onClick={handleExitClick}
          icon="pi pi-sign-out"
          label={isMobile ? t('ExitUser') : t('exitAccount')}
          className={styles.exitButton}
        />
      </footer>
      <Dialog
        visible={showExitDialog}
        onHide={handleCancelExit}
        header={t('confirmExit')}
        modal
        className={styles.exitDialog}
      >
        <div className={styles.exitContent}>
          <p>{t('confirmExitMessage')}</p>
          <div className={styles.exitActions}>
            <WhiteButton label={t('cancel')} onClick={handleCancelExit} />
            <GradientButton label={t('ExitUser')} onClick={handleConfirmExit} />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default Footer;
