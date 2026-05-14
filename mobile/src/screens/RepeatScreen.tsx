import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Lang } from '../../../shared/types/lang';
import { LANGS } from '../../../shared/types/lang';
import type { Word } from '../../../shared/types/word';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  initializeRepeatState,
  resetRepeatState,
  type RepeatState,
} from '../../../shared/utils/repeatUtils';
import { fetchWords } from '../api/wordsApi';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, LoadingState } from '../components/ScreenStates';
import { SectionCard } from '../components/SectionCard';
import { getFrontCardLanguage } from '../shared/storage/languageSettings';
import { theme } from '../shared/theme/theme';

const getFilledLanguages = (word: Word): Lang[] => {
  return LANGS.filter((lang) => Boolean(word[lang]?.trim()));
};

export const RepeatScreen = () => {
  const { t } = useTranslation();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [repeatState, setRepeatState] = useState<RepeatState>(initializeRepeatState([]));
  const [frontLang, setFrontLang] = useState<Lang>('ru');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const [loadedWords, savedFrontLang] = await Promise.all([
          fetchWords(),
          getFrontCardLanguage(),
        ]);
        setWords(loadedWords);
        setRepeatState(initializeRepeatState(loadedWords));
        if (savedFrontLang) {
          setFrontLang(savedFrontLang);
        }
      } catch {
        setWords([]);
        setRepeatState(initializeRepeatState([]));
      } finally {
        setLoading(false);
      }
    };

    void loadWords();
  }, []);

  const currentWord = useMemo(() => {
    if (
      repeatState.wordsQueue.length === 0 ||
      repeatState.currentIndex >= repeatState.wordsQueue.length
    ) {
      return null;
    }

    return repeatState.wordsQueue[repeatState.currentIndex];
  }, [repeatState.currentIndex, repeatState.wordsQueue]);

  const filledLangs = useMemo(() => {
    if (!currentWord) {
      return [] as Lang[];
    }

    return getFilledLanguages(currentWord);
  }, [currentWord]);

  useEffect(() => {
    if (filledLangs.length === 0) {
      return;
    }

    if (!filledLangs.includes(frontLang)) {
      setFrontLang(filledLangs[0]);
      setIsFlipped(false);
    }
  }, [filledLangs, frontLang]);

  const frontText = useMemo(() => {
    if (!currentWord) {
      return '';
    }

    return currentWord[frontLang]?.trim() || '';
  }, [currentWord, frontLang]);

  const backItems = useMemo(() => {
    if (!currentWord) {
      return [] as { lang: Lang; value: string }[];
    }

    return filledLangs.map((lang) => ({
      lang,
      value: currentWord[lang]?.trim() || '',
    }));
  }, [currentWord, filledLangs]);

  const handleCorrect = () => {
    const next = handleCorrectAnswer(currentWord, repeatState, words);
    setRepeatState(next.newState);
    setIsFlipped(false);
  };

  const handleIncorrect = () => {
    const next = handleIncorrectAnswer(currentWord, repeatState);
    setRepeatState(next.newState);
    setIsFlipped(false);
  };

  const handleRepeatAgain = () => {
    setRepeatState(resetRepeatState(words));
    setIsFlipped(false);
  };

  if (loading) {
    return <LoadingState title={t('repeat')} />;
  }

  if (words.length === 0) {
    return <EmptyState title={t('repeat')} message={t('noWords')} />;
  }

  if (repeatState.isCompleted) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.completedText}>{t('allWordsCompleted')}</Text>
        <PrimaryButton label={t('repeatAgain')} onPress={handleRepeatAgain} />
      </View>
    );
  }

  if (!currentWord) {
    return <LoadingState title={t('repeat')} />;
  }

  return (
    <AppScreen currentScreen="Repeat">
      <View style={styles.langRow}>
        {filledLangs.map((lang) => (
          <Pressable
            key={lang}
            onPress={() => {
              setFrontLang(lang);
              setIsFlipped(false);
            }}
            style={[styles.langChip, frontLang === lang && styles.langChipActive]}
          >
            <Text style={[styles.langChipText, frontLang === lang && styles.langChipTextActive]}>
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionCard>
        <Pressable onPress={() => setIsFlipped(Boolean(!isFlipped))}>
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {!isFlipped ? (
              <Text style={styles.frontText}>{frontText || t('translationNotSpecified')}</Text>
            ) : (
              <View style={styles.backWrap}>
                {backItems.map((item) => (
                  <Text key={item.lang} style={styles.backText}>
                    {item.lang.toUpperCase()}: {item.value}
                  </Text>
                ))}
              </View>
            )}
          </LinearGradient>
        </Pressable>
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
        <Text style={styles.progressMain}>
          {t('progress', { current: repeatState.correctWords.size, total: words.length })}
        </Text>
        <Text style={styles.progressSecondary}>
          {t('correctCount', { count: repeatState.correctWords.size })}
        </Text>
        <Text style={styles.progressSecondary}>
          {t('incorrectCount', { count: repeatState.incorrectWords.size })}
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
  completedText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  langChip: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  langChipText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: theme.colors.textOnPrimary,
  },
  card: {
    minHeight: theme.wordCard.minHeight,
    borderRadius: theme.wordCard.borderRadius,
    padding: theme.wordCard.padding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.wordCard.frontFontSize,
    fontWeight: '700',
    textAlign: 'center',
  },
  backWrap: {
    gap: theme.wordCard.faceGap,
    width: '100%',
    alignItems: 'center',
  },
  backText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: theme.wordCard.backFontSize,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
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
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 6,
  },
  progressMain: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  progressSecondary: {
    color: theme.colors.textSecondary,
  },
});
