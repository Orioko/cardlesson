import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUser } from '../../utils/localAuth';
import styles from './LoginPage.module.scss';

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const { loading, error, handleLogin, handleRegister, clearError } = useAuth({
        onSuccess: () => {
            navigate('/');
        }
    });

    let isAuthorized = false;
    try {
        const user = getCurrentUser();
        isAuthorized = Boolean(user);
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }

    if (isAuthorized) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async () => {
        if (loading) {
            return;
        }

        const success = isRegister 
            ? await handleRegister(email, password)
            : await handleLogin(email, password);

        if (!success) {
            return;
        }
    };

    const handleToggleMode = () => {
        setIsRegister(!isRegister);
        clearError();
    };

    return (
        <div className={styles.loginContainer}>
            <Header title={t('loginTitle')} showExitButton={false} />
            <div className={styles.loginContent}>
                <p className={styles.subtitle}>{t('loginSubtitle')}</p>
                {error && (
                    <Message severity="error" text={error} className={styles.message} />
                )}
                <div className={styles.form}>
                    <InputText
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('email') || 'Email'}
                        className={styles.input}
                        type="email"
                    />
                    <InputText
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('password') || 'Пароль'}
                        className={styles.input}
                        type="password"
                    />
                    <GradientButton
                        onClick={handleSubmit}
                        icon={isRegister ? 'pi pi-user-plus' : 'pi pi-sign-in'}
                        label={isRegister ? (t('register') || 'Регистрация') : (t('loginButton') || 'Войти')}
                        className={styles.loginButton}
                    />
                    <Button
                        label={isRegister ? (t('haveAccount') || 'Уже есть аккаунт?') : (t('noAccount') || 'Нет аккаунта?')}
                        onClick={handleToggleMode}
                        link
                        className={styles.toggleButton}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
