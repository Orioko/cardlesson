import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RootStackParamList } from '../app/navigation/types';
import { theme } from '../shared/theme/theme';

type QuickNavProps = {
  currentScreen: keyof RootStackParamList;
};

const navItems: Array<{
  screen: keyof RootStackParamList;
  labelKey: string;
  iconName: 'menu-book' | 'spellcheck' | 'sync' | 'timer' | 'bar-chart' | 'settings';
}> = [
  { screen: 'Dictionary', labelKey: 'dictionary', iconName: 'menu-book' },
  { screen: 'Spelling', labelKey: 'spelling', iconName: 'spellcheck' },
  { screen: 'Repeat', labelKey: 'repeat', iconName: 'sync' },
  { screen: 'Timer', labelKey: 'timer', iconName: 'timer' },
  { screen: 'Records', labelKey: 'records', iconName: 'bar-chart' },
  { screen: 'Settings', labelKey: 'settings', iconName: 'settings' },
];

export const QuickNav = ({ currentScreen }: QuickNavProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = item.screen === currentScreen;

        return (
          <Pressable
            key={item.screen}
            onPress={() => {
              if (isActive) {
                return;
              }
              navigation.navigate(item.screen);
            }}
            style={[styles.button, isActive && styles.buttonActive]}
            accessibilityRole="button"
            accessibilityLabel={t(item.labelKey)}
          >
            <MaterialIcons
              name={item.iconName}
              size={20}
              color={isActive ? theme.colors.textOnPrimary : theme.colors.textPrimary}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: theme.spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonActive: {
    backgroundColor: theme.colors.gradientStart,
    borderColor: theme.colors.gradientStart,
  },
});
