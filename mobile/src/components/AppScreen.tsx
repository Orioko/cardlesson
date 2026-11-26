import { isWithinServerHours, SERVER_HOURS_LABEL } from '../../../shared/constants/serverSchedule';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../app/navigation/types';
import { dismissOfflineBanner, useOfflineBanner } from '../shared/api/connectivity';
import { theme } from '../shared/theme/theme';
import { QuickNav } from './QuickNav';

type AppScreenProps = {
  children: ReactNode;
  currentScreen?: keyof RootStackParamList;
};

export const AppScreen = ({ children, currentScreen }: AppScreenProps) => {
  const { t } = useTranslation();
  const showOfflineBanner = useOfflineBanner();

  return (
    // Сверху отступ под вырез экрана уже даёт системная шапка навигатора,
    // поэтому здесь безопасная зона только по бокам и снизу — иначе отступ сверху двойной.
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        {showOfflineBanner ? (
          <View style={styles.offlineBanner} accessibilityRole="alert">
            <Text style={styles.offlineText}>
              {isWithinServerHours()
                ? t('offlineBanner')
                : t('offlineBannerOffHours', SERVER_HOURS_LABEL)}
            </Text>
            <Pressable
              onPress={dismissOfflineBanner}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
              hitSlop={10}
              style={styles.offlineClose}
            >
              <Text style={styles.offlineCloseText}>✕</Text>
            </Pressable>
          </View>
        ) : null}
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4e5',
    borderColor: '#f5b041',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  offlineText: {
    flex: 1,
    color: '#8a4b00',
    fontSize: theme.fontSize.sm,
  },
  offlineClose: {
    paddingLeft: theme.spacing.sm,
  },
  offlineCloseText: {
    color: '#8a4b00',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
});
