import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import { login, register } from '../../utils/localAuth';
import styles from './LoginPage.module.scss';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError(t('fillAllFields') || 'Заполните все поля');
            return;
        }

        if (loading) {
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(email.trim());
            } else {
                await login(email.trim());
            }
            window.location.reload();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Ошибка входа');
            setLoading(false);
        }
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
                        onClick={() => setIsRegister(!isRegister)}
                        link
                        className={styles.toggleButton}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
