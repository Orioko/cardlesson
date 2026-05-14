import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Word } from '../../../shared/types/word';
import { LANGS, type Lang } from '../../../shared/types/lang';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  initializeRepeatState,
  resetRepeatState,
  type RepeatState,
} from '../../../shared/utils/repeatUtils';
import { isSpellingAnswerCorrect } from '../../../shared/utils/spellingAnswerUtils';
import { fetchWords } from '../api/wordsApi';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState, LoadingState } from '../components/ScreenStates';
import { BodyText, MutedText, SectionTitle } from '../components/Typography';
import { theme } from '../shared/theme/theme';

type CheckResult = 'idle' | 'incorrect';

const getFilledLanguages = (word: Word): Lang[] => {
  return LANGS.filter((lang) => Boolean(word[lang]?.trim()));
};

const getLangLabel = (lang: Lang): string => {
  if (lang === 'ru') {
    return 'Russian';
  }
  if (lang === 'en') {
    return 'English';
  }
  return 'Korean';
};

export const SpellingScreen = () => {
  const { t } = useTranslation();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [repeatState, setRepeatState] = useState<RepeatState>(initializeRepeatState([]));
  const [targetLang, setTargetLang] = useState<Lang>('ru');
  const [answer, setAnswer] = useState<string>('');
  const [result, setResult] = useState<CheckResult>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const loadedWords = await fetchWords();
        setWords(loadedWords);
        setRepeatState(initializeRepeatState(loadedWords));
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
    if (!filledLangs.includes(targetLang)) {
      setTargetLang(filledLangs[0]);
      setAnswer('');
      setResult('idle');
      setShowSolution(false);
    }
  }, [filledLangs, targetLang]);

  const expectedValue = useMemo(() => {
    if (!currentWord) {
      return '';
    }
    return currentWord[targetLang]?.trim() || '';
  }, [currentWord, targetLang]);

  const hints = useMemo(() => {
    if (!currentWord) {
      return [] as { lang: Lang; value: string }[];
    }

    return filledLangs
      .filter((lang) => lang !== targetLang)
      .map((lang) => ({ lang, value: currentWord[lang]?.trim() || '' }))
      .filter((item) => Boolean(item.value));
  }, [currentWord, filledLangs, targetLang]);

  const handleCheck = () => {
    if (!currentWord) {
      return;
    }

    if (!expectedValue) {
      setResult('incorrect');
      setShowSolution(true);
      return;
    }

    const isCorrect = isSpellingAnswerCorrect({
      answer,
      expected: expectedValue,
      lang: targetLang,
    });

    if (isCorrect) {
      const next = handleCorrectAnswer(currentWord, repeatState, words);
      setRepeatState(next.newState);
      setAnswer('');
      setResult('idle');
      setShowSolution(false);
      return;
    }

    setResult('incorrect');
  };

  const handleSkip = () => {
    if (!currentWord) {
      return;
    }

    const next = handleIncorrectAnswer(currentWord, repeatState);
    setRepeatState(next.newState);
    setAnswer('');
    setResult('idle');
    setShowSolution(false);
  };

  const handleRepeatAgain = () => {
    setRepeatState(resetRepeatState(words));
    setAnswer('');
    setResult('idle');
    setShowSolution(false);
  };

  if (loading) {
    return <LoadingState title={t('spelling')} />;
  }

  if (words.length === 0) {
    return <EmptyState title={t('spelling')} message={t('noWords')} />;
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
    return <LoadingState title={t('spelling')} />;
  }

  return (
    <AppScreen currentScreen="Spelling">
      <View style={styles.plainCard}>
        <SectionTitle>{t('targetLanguage')}</SectionTitle>
        <View style={styles.langRow}>
          {filledLangs.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => {
                setTargetLang(lang);
                setAnswer('');
                setResult('idle');
                setShowSolution(false);
              }}
              style={[styles.langChip, targetLang === lang && styles.langChipActive]}
            >
              <Text style={[styles.langChipText, targetLang === lang && styles.langChipTextActive]}>
                {getLangLabel(lang)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.plainCard}>
        <SectionTitle>{t('hints')}</SectionTitle>
        {hints.length === 0 ? (
          <MutedText>{t('noHint')}</MutedText>
        ) : (
          hints.map((item) => (
            <BodyText key={item.lang}>
              {item.lang.toUpperCase()}: {item.value}
            </BodyText>
          ))
        )}
      </View>

      <View style={styles.plainCard}>
        <SectionTitle>{t('yourAnswer')}</SectionTitle>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder={t('enterCorrectSpelling')}
          style={styles.input}
          onSubmitEditing={handleCheck}
        />

        <View style={styles.actionsColumn}>
          <View style={styles.actionsRow}>
            <View style={styles.actionButtonWrap}>
              <PrimaryButton label={t('check')} onPress={handleCheck} disabled={!answer.trim()} />
            </View>
          </View>

          {result === 'incorrect' && (
            <View style={styles.actionsRow}>
              <View style={styles.actionButtonWrap}>
                <PrimaryButton
                  label={t('tryAgain')}
                  onPress={() => {
                    setAnswer('');
                    setResult('idle');
                    setShowSolution(false);
                  }}
                  variant="neutral"
                />
              </View>
              <View style={styles.actionButtonWrap}>
                <PrimaryButton label={t('skip')} onPress={handleSkip} variant="neutral" />
              </View>
            </View>
          )}
        </View>

        {result === 'incorrect' && <Text style={styles.errorText}>{t('answerIncorrect')}</Text>}

        {result === 'incorrect' && (
          <View style={styles.solutionWrap}>
            <PrimaryButton
              label={showSolution ? t('hideAnswer') : t('showAnswer')}
              onPress={() => setShowSolution(Boolean(!showSolution))}
              variant="neutral"
            />
            {showSolution && (
              <Text style={styles.solutionText}>
                {targetLang.toUpperCase()}: {expectedValue || t('notSpecified')}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.progressWrap}>
        <Text style={styles.progressMain}>
          {t('progress', { current: repeatState.correctWords.size, total: words.length })}
        </Text>
        <BodyText>{t('correctCount', { count: repeatState.correctWords.size })}</BodyText>
        <BodyText>{t('incorrectCount', { count: repeatState.incorrectWords.size })}</BodyText>
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  plainCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionsColumn: {
    gap: theme.spacing.sm,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  actionButtonWrap: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  solutionWrap: {
    gap: theme.spacing.sm,
  },
  solutionText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
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
});
