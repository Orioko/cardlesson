import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import { EmptyState, LoadingState } from '../../components/PageStates';
import type { Lang } from '../../components/WordCard/types';
import { getFilledLanguages, getFrontLanguage } from '../../components/WordCard/utils';
import { useWordsContext } from '../../hooks/useWordsContext';
import type { Word } from '../../types/word';
import { getLangLabel } from '../../utils/language/languageUtils';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  initializeRepeatState,
  resetRepeatState,
  type RepeatState,
} from '../RepeatPage/repeatUtils';
import { isSpellingAnswerCorrect } from './spellingAnswerUtils';
import styles from './SpellingPage.module.scss';

type CheckResult = 'idle' | 'correct' | 'incorrect';

interface SpellingCardProps {
  currentWord: Word;
  onCorrect: (word: Word) => void;
  onSkip: (word: Word) => void;
}

const SpellingCard = ({ currentWord, onCorrect, onSkip }: SpellingCardProps) => {
  const { t } = useTranslation();

  const currentWordData = useMemo(() => {
    return {
      ru: currentWord.ru,
      en: currentWord.en,
      ko: currentWord.ko,
      translations: currentWord.translations,
    };
  }, [currentWord.en, currentWord.ko, currentWord.ru, currentWord.translations]);

  const filledLangs = useMemo(() => {
    return getFilledLanguages(currentWordData);
  }, [currentWordData]);

  const defaultTargetLang = useMemo<Lang>(() => {
    const preferred = getFrontLanguage(currentWordData, undefined, currentWord.id);
    const preferredValue = preferred ? currentWordData[preferred]?.trim() : '';

    return (preferred && preferredValue ? preferred : filledLangs[0]) || 'ru';
  }, [currentWord.id, currentWordData, filledLangs]);

  const [targetLang, setTargetLang] = useState<Lang>(defaultTargetLang);
  const [answer, setAnswer] = useState<string>('');
  const [result, setResult] = useState<CheckResult>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const expectedValue = useMemo(() => {
    return currentWord[targetLang]?.trim() || '';
  }, [currentWord, targetLang]);

  const hints = useMemo(() => {
    return filledLangs
      .filter((l) => l !== targetLang)
      .map((lang) => ({
        lang,
        value: currentWordData[lang]?.trim() || '',
      }))
      .filter((item) => Boolean(item.value));
  }, [currentWordData, filledLangs, targetLang]);

  const canCheck = Boolean(answer.trim());

  const handleCheck = useCallback(() => {
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
      onCorrect(currentWord);
      return;
    }

    setResult('incorrect');
  }, [answer, currentWord, expectedValue, onCorrect, targetLang]);

  const handleTryAgain = useCallback(() => {
    setAnswer('');
    setResult('idle');
    setShowSolution(false);
  }, []);

  const handleSkip = useCallback(() => {
    onSkip(currentWord);
  }, [currentWord, onSkip]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    if (canCheck) {
      handleCheck();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('targetLanguage')}</div>
        <div className={styles.langSelector}>
          {filledLangs.map((lang) => (
            <label key={lang} className={styles.langOption}>
              <input
                type="radio"
                name="spellingTargetLang"
                checked={targetLang === lang}
                onChange={() => {
                  setTargetLang(lang);
                  setAnswer('');
                  setResult('idle');
                  setShowSolution(false);
                }}
                className={styles.radio}
              />
              <span className={styles.langLabel}>{getLangLabel(lang, t)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('hint')}</div>
        {hints.length === 0 ? (
          <div className={styles.emptyHint}>{t('noHint')}</div>
        ) : (
          <div className={styles.hints}>
            {hints.map((item) => (
              <div key={item.lang} className={styles.hintRow}>
                <span className={styles.hintLang}>{item.lang.toUpperCase()}:</span>
                <span className={styles.hintValue}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('yourAnswer')}</div>
        <InputText
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleInputKeyDown}
          className={styles.input}
          placeholder={t('enterCorrectSpelling')}
        />

        <div className={styles.actions}>
          <Button
            label={t('checkSpelling')}
            icon="pi pi-check"
            onClick={handleCheck}
            disabled={!canCheck}
          />
          {result === 'incorrect' && (
            <>
              <Button
                label={t('tryAgain')}
                icon="pi pi-refresh"
                onClick={handleTryAgain}
                severity="secondary"
                outlined
              />
              <Button
                label={t('skipWord')}
                icon="pi pi-forward"
                onClick={handleSkip}
                severity="secondary"
                outlined
              />
            </>
          )}
        </div>

        {result === 'incorrect' && (
          <Message severity="error" text={t('answerIncorrect')} className={styles.message} />
        )}

        {result === 'incorrect' && (
          <div className={styles.solution}>
            <Button
              label={showSolution ? t('hideAnswer') : t('showAnswer')}
              icon={showSolution ? 'pi pi-eye-slash' : 'pi pi-eye'}
              onClick={() => setShowSolution((v) => !v)}
              text
            />
            {showSolution && (
              <div className={styles.solutionText}>
                <span className={styles.solutionLabel}>{targetLang.toUpperCase()}:</span>
                <span className={styles.solutionValue}>
                  {expectedValue || t('translationNotSpecified')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SpellingPageContent = () => {
  const { t } = useTranslation();
  const { words } = useWordsContext();

  const [repeatState, setRepeatState] = useState<RepeatState>(() => initializeRepeatState(words));

  const currentWord = useMemo(() => {
    if (
      repeatState.wordsQueue.length === 0 ||
      repeatState.currentIndex >= repeatState.wordsQueue.length
    ) {
      return null;
    }
    return repeatState.wordsQueue[repeatState.currentIndex];
  }, [repeatState.currentIndex, repeatState.wordsQueue]);

  const handleRepeatAgain = useCallback(() => {
    setRepeatState(resetRepeatState(words));
  }, [words]);

  if (words.length === 0) {
    return <EmptyState title={t('spelling')} containerClassName={styles.spellingContainer} />;
  }

  if (repeatState.isCompleted) {
    return (
      <div className={styles.spellingContainer}>
        <Header title={t('spelling')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.finishedState}>
            <p>{t('allWordsCompleted')}</p>
            <GradientButton
              icon="pi pi-refresh"
              label={t('repeatAgain')}
              onClick={handleRepeatAgain}
              className={styles.repeatButton}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentWord) {
    return <LoadingState title={t('spelling')} containerClassName={styles.spellingContainer} />;
  }

  return (
    <div className={styles.spellingContainer}>
      <Header title={t('spelling')} showNavigation={true} />
      <div className={styles.content}>
        <SpellingCard
          key={currentWord.id}
          currentWord={currentWord}
          onCorrect={(word) => {
            const next = handleCorrectAnswer(word, repeatState, words);
            setRepeatState(next.newState);
          }}
          onSkip={(word) => {
            const next = handleIncorrectAnswer(word, repeatState);
            setRepeatState(next.newState);
          }}
        />

        <div className={styles.progress}>
          <span className={styles.progressMain}>
            {t('progress', {
              current: repeatState.correctWords.size,
              total: words.length,
            })}
          </span>
          <div className={styles.stats}>
            <span className={styles.progressSecondary}>
              {t('correctCount', { count: repeatState.correctWords.size })}
            </span>
            <span className={styles.progressSecondary}>
              {t('incorrectCount', { count: repeatState.incorrectCount })}
            </span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const SpellingPage = () => {
  const { t } = useTranslation();
  const { words, loading } = useWordsContext();
  const wordsKey = useMemo(() => words.map((w) => w.id).join(','), [words]);

  if (loading) {
    return <LoadingState title={t('spelling')} containerClassName={styles.spellingContainer} />;
  }

  return <SpellingPageContent key={wordsKey} />;
};

export default SpellingPage;
