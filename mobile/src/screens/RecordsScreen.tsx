import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState } from '../components/ScreenStates';
import { SectionCard } from '../components/SectionCard';
import { AppTitle, BodyText, MutedText, SectionTitle } from '../components/Typography';
import type { TimerRecord } from '../shared/storage/timerRecords';
import {
  clearTimerRecords,
  getTimerDurations,
  getTimerRecords,
} from '../shared/storage/timerRecords';
import { theme } from '../shared/theme/theme';

export const RecordsScreen = () => {
  const { t } = useTranslation();

  const [records, setRecords] = useState<Record<number, TimerRecord[]>>({});

  const loadRecords = useCallback(async () => {
    const loaded = await getTimerRecords();
    setRecords(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords])
  );

  const hasRecords = useMemo(() => {
    return Object.keys(records).length > 0;
  }, [records]);

  const handleClearRecords = () => {
    Alert.alert(t('clearRecords'), t('confirmClearRecords'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('clearRecords'),
        style: 'destructive',
        onPress: () => {
          void clearTimerRecords().then(() => {
            void loadRecords();
          });
        },
      },
    ]);
  };

  return (
    <AppScreen currentScreen="Records">
      <ScrollView contentContainerStyle={styles.container}>
        <AppTitle>{t('records')}</AppTitle>

        {!hasRecords ? (
          <EmptyState title={t('records')} message={t('noRecordsYet')} />
        ) : (
          <View style={styles.list}>
            {getTimerDurations().map((minutes) => {
              const recordsForDuration = records[minutes] || [];

              return (
                <SectionCard key={minutes}>
                  <SectionTitle>
                    {minutes} {t('minShort')}
                  </SectionTitle>

                  {recordsForDuration.length > 0 ? (
                    recordsForDuration.map((record, index) => (
                      <View key={`${record.date}_${index}`} style={styles.recordRow}>
                        <BodyText>
                          #{index + 1}: {record.wordsCompleted}
                        </BodyText>
                        <MutedText>{new Date(record.date).toLocaleDateString()}</MutedText>
                      </View>
                    ))
                  ) : (
                    <MutedText>{t('noRecord')}</MutedText>
                  )}
                </SectionCard>
              );
            })}
          </View>
        )}

        <PrimaryButton label={t('clearRecords')} onPress={handleClearRecords} variant="neutral" />
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  list: {
    gap: 10,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});
