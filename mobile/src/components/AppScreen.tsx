import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../app/navigation/types';
import { theme } from '../shared/theme/theme';
import { QuickNav } from './QuickNav';

type AppScreenProps = {
  children: ReactNode;
  currentScreen?: keyof RootStackParamList;
};

export const AppScreen = ({ children, currentScreen }: AppScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {currentScreen ? <QuickNav currentScreen={currentScreen} /> : null}
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
});
