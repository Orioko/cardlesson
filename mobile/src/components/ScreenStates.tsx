import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppTitle, BodyText, MutedText } from './Typography';
import { theme } from '../shared/theme/theme';

type BaseStateProps = {
  title?: string;
  message?: string;
};

export const LoadingState = ({ title, message }: BaseStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.centerWrap}>
      <ActivityIndicator size="large" />
      {title ? <AppTitle>{title}</AppTitle> : null}
      {message ? <MutedText>{message}</MutedText> : <MutedText>{t('loading')}</MutedText>}
    </View>
  );
};

export const EmptyState = ({ title, message }: BaseStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.centerWrap}>
      {title ? <AppTitle>{title}</AppTitle> : null}
      <MutedText>{message ?? t('noWords')}</MutedText>
    </View>
  );
};

export const ErrorState = ({ title, message }: BaseStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.centerWrap}>
      {title ? <AppTitle>{title}</AppTitle> : null}
      <BodyText>{message ?? t('error')}</BodyText>
    </View>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
});
