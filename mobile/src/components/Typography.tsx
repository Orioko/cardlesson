import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme } from '../shared/theme/theme';

type TypographyProps = {
  children: ReactNode;
};

export const AppTitle = ({ children }: TypographyProps) => {
  return <Text style={styles.appTitle}>{children}</Text>;
};

export const SectionTitle = ({ children }: TypographyProps) => {
  return <Text style={styles.sectionTitle}>{children}</Text>;
};

export const BodyText = ({ children }: TypographyProps) => {
  return <Text style={styles.body}>{children}</Text>;
};

export const MutedText = ({ children }: TypographyProps) => {
  return <Text style={styles.muted}>{children}</Text>;
};

const styles = StyleSheet.create({
  appTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  body: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
  },
  muted: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});
