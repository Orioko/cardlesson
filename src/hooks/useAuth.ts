import { useState } from 'react';
import { login as authLogin, register as authRegister } from '../utils/localAuth';
import { validateEmail, validatePassword } from '../utils/validation';

interface UseAuthProps {
    onSuccess?: () => void;
}

export const useAuth = ({ onSuccess }: UseAuthProps = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setError(emailValidation.error || 'Ошибка валидации email');
            return false;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.error || 'Ошибка валидации пароля');
            return false;
        }

        setError('');
        setLoading(true);

        try {
            await authLogin(email.trim(), password);
            
            if (onSuccess) {
                onSuccess();
            }
            
            return true;
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Ошибка входа');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (email: string, password: string): Promise<boolean> => {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setError(emailValidation.error || 'Ошибка валидации email');
            return false;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.error || 'Ошибка валидации пароля');
            return false;
        }

        setError('');
        setLoading(true);

        try {
            await authRegister(email.trim(), password);
            
            if (onSuccess) {
                onSuccess();
            }
            
            return true;
        } catch (registerError) {
            setError(registerError instanceof Error ? registerError.message : 'Ошибка регистрации');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError('');

    return {
        loading,
        error,
        handleLogin,
        handleRegister,
        clearError
    };
};

