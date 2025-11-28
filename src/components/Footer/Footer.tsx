import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../utils/localAuth';
import GradientButton from '../GradientButton';
import styles from './Footer.module.scss';

const Footer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleExit = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    };

    return (
        <footer className={styles.footer}>
            <GradientButton
                onClick={handleExit}
                icon="pi pi-sign-out"
                label={t('exitAccount')}
                className={styles.exitButton}
            />
        </footer>
    );
};

export default Footer;

