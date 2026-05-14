import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppTitle } from '../components/Typography';
import { login, register } from '../shared/auth/localAuth';
import { theme } from '../shared/theme/theme';

export const LoginScreen = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError(t('enterEmailAndPassword'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError(t('authFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout>
      <AppTitle>{isRegister ? t('register') : t('login')}</AppTitle>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('password')}
        secureTextEntry
        style={styles.input}
      />

      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

      <PrimaryButton
        label={loading ? t('pleaseWait') : isRegister ? t('createAccount') : t('login')}
        onPress={() => {
          void handleSubmit();
        }}
        disabled={loading}
      />

      <Pressable
        style={styles.linkButton}
        onPress={() => {
          setIsRegister(Boolean(!isRegister));
          setError('');
        }}
      >
        <Text style={styles.linkText}>
          {isRegister ? t('alreadyHaveAccount') : t('noAccountYet')}
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  linkText: {
    color: theme.colors.primary,
  },
});
