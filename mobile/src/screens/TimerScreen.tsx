import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import type { Word } from '../../../shared/types/word';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  initializeRepeatState,
  type RepeatState,
} from '../../../shared/utils/repeatUtils';
import { fetchWords } from '../api/wordsApi';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, LoadingState } from '../components/ScreenStates';
import { SectionCard } from '../components/SectionCard';
import { AppTitle } from '../components/Typography';
import { getTimerDurations, saveTimerRecord } from '../shared/storage/timerRecords';
import { theme } from '../shared/theme/theme';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  totalSeconds: number;
}

export const TimerScreen = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(true);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    isFinished: false,
    totalSeconds: 0,
  });
  const [repeatState, setRepeatState] = useState<RepeatState | null>(null);
  const [wordsCompleted, setWordsCompleted] = useState<Set<string>>(new Set());
  const wordsCompletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadWords = async () => {
      try {
        const loadedWords = await fetchWords();
        setWords(loadedWords);
      } catch {
        setWords([]);
      } finally {
        setLoading(false);
      }
    };

    void loadWords();
  }, []);

  useEffect(() => {
    wordsCompletedRef.current = wordsCompleted;
  }, [wordsCompleted]);

  useEffect(() => {
    if (!timerState.isRunning || timerState.timeLeft <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeLeft <= 1) {
          if (selectedTimer && wordsCompletedRef.current.size > 0) {
            void saveTimerRecord(selectedTimer, wordsCompletedRef.current.size);
          }
          return {
            ...prev,
            timeLeft: 0,
            isRunning: false,
            isFinished: true,
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedTimer, timerState.isRunning, timerState.timeLeft]);

  const currentWord = useMemo(() => {
    if (
      !repeatState ||
      repeatState.wordsQueue.length === 0 ||
      repeatState.currentIndex >= repeatState.wordsQueue.length
    ) {
      return null;
    }

    return repeatState.wordsQueue[repeatState.currentIndex];
  }, [repeatState]);

  useEffect(() => {
    if (
      timerState.isRunning &&
      !timerState.isFinished &&
      (repeatState?.isCompleted === true ||
        Boolean(!currentWord && repeatState && repeatState.wordsQueue.length === 0))
    ) {
      if (selectedTimer && wordsCompletedRef.current.size > 0) {
        void saveTimerRecord(selectedTimer, wordsCompletedRef.current.size);
      }

      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        isFinished: true,
      }));
    }
  }, [currentWord, repeatState, selectedTimer, timerState.isFinished, timerState.isRunning]);

  const handleStartTimer = () => {
    if (!selectedTimer) {
      return;
    }

    const totalSeconds = selectedTimer * 60;
    setTimerState({
      timeLeft: totalSeconds,
      isRunning: true,
      isFinished: false,
      totalSeconds,
    });
    setRepeatState(initializeRepeatState(words));
    setWordsCompleted(new Set());
  };

  const handleCorrect = () => {
    if (!currentWord || !repeatState) {
      return;
    }

    const next = handleCorrectAnswer(currentWord, repeatState, words);
    setRepeatState(next.newState);
    setWordsCompleted((prev) => new Set(prev).add(currentWord.id));
  };

  const handleIncorrect = () => {
    if (!currentWord || !repeatState) {
      return;
    }

    const next = handleIncorrectAnswer(currentWord, repeatState);
    setRepeatState(next.newState);
  };

  const handleReset = () => {
    setSelectedTimer(null);
    setTimerState({
      timeLeft: 0,
      isRunning: false,
      isFinished: false,
      totalSeconds: 0,
    });
    setRepeatState(null);
    setWordsCompleted(new Set());
  };

  if (loading) {
    return <LoadingState title={t('timer')} />;
  }

  if (words.length === 0) {
    return <EmptyState title={t('timer')} message={t('noWords')} />;
  }

  if (!selectedTimer) {
    return (
      <AppScreen currentScreen="Timer">
        <AppTitle>{t('selectTimerDuration')}</AppTitle>
        <View style={styles.timerOptions}>
          {getTimerDurations().map((minutes) => (
            <View key={minutes} style={styles.timerOptionButtonWrap}>
              <PrimaryButton
                label={`${minutes} ${t('minShort')}`}
                variant="primary"
                onPress={() => {
                  setSelectedTimer(minutes);
                }}
              />
            </View>
          ))}
        </View>
      </AppScreen>
    );
  }

  if (timerState.isFinished) {
    const completedCount = wordsCompleted.size;
    const remainingCount = words.length - completedCount;

    return (
      <View style={styles.centerWrap}>
        <AppTitle>{t('timerFinished')}</AppTitle>
        <BodyText>{t('wordsCompleted', { count: completedCount })}</BodyText>
        <BodyText>{t('wordsRemaining', { count: remainingCount })}</BodyText>
        <PrimaryButton label={t('startAgain')} onPress={handleReset} />
      </View>
    );
  }

  if (selectedTimer && !timerState.isRunning && !timerState.isFinished) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.timerText}>{formatTime(selectedTimer * 60)}</Text>
        <PrimaryButton label={t('startTimer')} onPress={handleStartTimer} />
      </View>
    );
  }

  if (!currentWord) {
    return <LoadingState title={t('timer')} />;
  }

  return (
    <AppScreen currentScreen="Timer">
      <Text style={styles.timerText}>{formatTime(timerState.timeLeft)}</Text>
      <SectionCard>
        <View style={styles.card}>
          <Text style={styles.cardText}>{currentWord.ru}</Text>
          <Text style={styles.cardSecondary}>
            {currentWord.en} - {currentWord.ko}
          </Text>
        </View>
      </SectionCard>

      <View style={styles.actionsRow}>
        <View style={styles.actionButtonWrap}>
          <PrimaryButton label={t('correct')} onPress={handleCorrect} variant="primary" />
        </View>
        <View style={styles.actionButtonWrap}>
          <PrimaryButton label={t('repeatWord')} onPress={handleIncorrect} variant="neutral" />
        </View>
      </View>

      <View style={styles.progressWrap}>
        <Text style={styles.progressText} numberOfLines={1}>
          {t('progress', { current: wordsCompleted.size, total: words.length })}
        </Text>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  timerOptions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: theme.spacing.md,
    width: '100%',
  },
  timerOptionButtonWrap: {
    flex: 1,
  },
  timerText: {
    color: theme.colors.textPrimary,
    fontSize: 42,
    fontWeight: '700',
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  cardText: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardSecondary: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  actionButtonWrap: {
    flex: 1,
  },
  progressWrap: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  progressText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    flexShrink: 1,
  },
});
