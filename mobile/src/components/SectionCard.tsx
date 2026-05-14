import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../shared/theme/theme';

type SectionCardProps = {
  children: ReactNode;
};

export const SectionCard = ({ children }: SectionCardProps) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
