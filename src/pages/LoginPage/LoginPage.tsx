import { signInWithPopup } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import { auth, googleProvider } from '../../firebase';
import styles from './LoginPage.module.scss';

const LoginPage = () => {
    const { t } = useTranslation();

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log('Пользователь вошёл:', user);
        } catch (error) {
            console.error('Ошибка входа:', error);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <Header title={t('loginTitle')} showExitButton={false} />
            <div className={styles.loginContent}>
                <p className={styles.subtitle}>{t('loginSubtitle')}</p>
                <GradientButton
                    onClick={handleGoogleLogin}
                    icon="pi pi-google"
                    label={t('loginButton')}
                    className={styles.loginButton}
                />
            </div>
        </div>
    );
};

export default LoginPage;
