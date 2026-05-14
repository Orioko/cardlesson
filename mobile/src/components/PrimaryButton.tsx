import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../shared/theme/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'neutral';
};

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) => {
  const isGradientVariant = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, variantStyles[variant], disabled && styles.disabled]}
    >
      {isGradientVariant ? (
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
};

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  neutral: {
    backgroundColor: theme.colors.neutral,
  },
});

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.md,
  },
  label: {
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
