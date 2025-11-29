import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { useWordsContext } from '../../hooks/useWordsContext';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  initializeRepeatState,
  resetRepeatState,
  type RepeatState,
} from '../../utils/repeatUtils';
import styles from './RepeatPage.module.scss';

const RepeatPageContent = () => {
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
  }, [repeatState.wordsQueue, repeatState.currentIndex]);

  const handleCorrect = useCallback(() => {
    const result = handleCorrectAnswer(currentWord, repeatState, words);
    setRepeatState(result.newState);
    if (result.shouldComplete) {
      return;
    }
  }, [currentWord, repeatState, words]);

  const handleIncorrect = useCallback(() => {
    const result = handleIncorrectAnswer(currentWord, repeatState);
    setRepeatState(result.newState);
  }, [currentWord, repeatState]);

  const handleRepeatAgain = useCallback(() => {
    setRepeatState(resetRepeatState(words));
  }, [words]);

  const hasWords = words.length > 0;

  if (!hasWords) {
    return (
      <div className={styles.repeatContainer}>
        <Header title={t('repeat')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <p>{t('noWords')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (repeatState.isCompleted) {
    return (
      <div className={styles.repeatContainer}>
        <Header title={t('repeat')} showNavigation={true} />
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
    return (
      <div className={styles.repeatContainer}>
        <Header title={t('repeat')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.loading}>
            <ProgressSpinner />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.repeatContainer}>
      <Header title={t('repeat')} showNavigation={true} />
      <div className={styles.content}>
        <div className={styles.cardWrapper}>
          <WordCard
            key={currentWord.id}
            wordId={currentWord.id}
            wordData={{
              ru: currentWord.ru,
              en: currentWord.en,
              ko: currentWord.ko,
              translations: currentWord.translations,
            }}
          />
        </div>
        <div className={styles.actions}>
          <Button
            icon="pi pi-check"
            onClick={handleCorrect}
            className={styles.correctButton}
            size="large"
            rounded
            aria-label={t('correct')}
            title={t('correct')}
          />
          <Button
            icon="pi pi-times"
            onClick={handleIncorrect}
            className={styles.incorrectButton}
            size="large"
            rounded
            aria-label={t('repeatWord')}
            title={t('repeatWord')}
          />
        </div>
        <div className={styles.progress}>
          <div className={styles.progressText}>
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
      </div>
      <Footer />
    </div>
  );
};

const RepeatPage = () => {
  const { t } = useTranslation();
  const { words, loading } = useWordsContext();
  const wordsKey = useMemo(() => words.map((w) => w.id).join(','), [words]);

  if (loading) {
    return (
      <div className={styles.repeatContainer}>
        <Header title={t('repeat')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.loading}>
            <ProgressSpinner />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <RepeatPageContent key={wordsKey} />;
};

export default RepeatPage;
