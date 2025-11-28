import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { useWordsContext } from '../../hooks/useWordsContext';
import styles from './RepeatPage.module.scss';

const RepeatPageContent = () => {
  const { t } = useTranslation();
  const { words } = useWordsContext();

  const [currentIndex, setCurrentIndex] = useState(() => 0);
  const [wordsQueue, setWordsQueue] = useState<typeof words>(() =>
    words.length > 0 ? [...words] : []
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctWords, setCorrectWords] = useState<Set<string>>(() => new Set());
  const [incorrectCount, setIncorrectCount] = useState(() => 0);

  const currentWord = useMemo(() => {
    if (wordsQueue.length === 0 || currentIndex >= wordsQueue.length) {
      return null;
    }
    return wordsQueue[currentIndex];
  }, [wordsQueue, currentIndex]);

  const handleCorrect = useCallback(() => {
    if (currentWord) {
      const newCorrectWords = new Set(correctWords);
      newCorrectWords.add(currentWord.id);
      setCorrectWords(newCorrectWords);

      if (newCorrectWords.size >= words.length) {
        setIsCompleted(true);
        return;
      }

      const newQueue = wordsQueue.filter((w) => w.id !== currentWord.id);
      setWordsQueue(newQueue);

      if (newQueue.length === 0) {
        const remainingWords = words.filter((w) => !newCorrectWords.has(w.id));
        if (remainingWords.length > 0) {
          setWordsQueue(remainingWords);
          setCurrentIndex(0);
        } else {
          setIsCompleted(true);
        }
      } else {
        let newIndex = currentIndex;
        if (newIndex >= newQueue.length) {
          newIndex = 0;
        }
        setCurrentIndex(newIndex);
      }
    }
  }, [currentWord, currentIndex, wordsQueue, correctWords, words]);

  const handleIncorrect = useCallback(() => {
    if (currentWord && wordsQueue.length > 0) {
      setIncorrectCount((prev) => prev + 1);
      const newQueue = [...wordsQueue];
      const wordToMove = newQueue.splice(currentIndex, 1)[0];
      newQueue.push(wordToMove);
      setWordsQueue(newQueue);

      if (currentIndex >= newQueue.length - 1) {
        setCurrentIndex(0);
      }
    }
  }, [currentWord, currentIndex, wordsQueue]);

  const handleRepeatAgain = useCallback(() => {
    setWordsQueue(words.length > 0 ? [...words] : []);
    setCurrentIndex(0);
    setIsCompleted(false);
    setCorrectWords(new Set());
    setIncorrectCount(0);
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

  if (isCompleted) {
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
              {t('progress', { current: currentIndex + 1, total: wordsQueue.length })}
            </span>
            <div className={styles.stats}>
              <span className={styles.progressSecondary}>
                {t('correctCount', { count: correctWords.size })}
              </span>
              <span className={styles.progressSecondary}>
                {t('incorrectCount', { count: incorrectCount })}
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
