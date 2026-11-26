import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useState, type FormEvent } from 'react';
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
    },
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

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
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
        {error && <Message severity="error" text={error} className={styles.message} />}
        {/* настоящая форма: Enter отправляет её, менеджер паролей узнаёт поля входа */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <InputText
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email') || 'Email'}
            className={styles.input}
            type="text"
            inputMode="email"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
          <InputText
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password') || 'Пароль'}
            className={styles.input}
            type="password"
            name="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <GradientButton
            type="submit"
            disabled={loading}
            icon={isRegister ? 'pi pi-user-plus' : 'pi pi-sign-in'}
            label={isRegister ? t('register') || 'Регистрация' : t('loginButton') || 'Войти'}
            className={styles.loginButton}
          />
          <Button
            label={
              isRegister
                ? t('haveAccount') || 'Уже есть аккаунт?'
                : t('noAccount') || 'Нет аккаунта?'
            }
            onClick={handleToggleMode}
            type="button"
            link
            className={styles.toggleButton}
          />
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
