import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AddWordForm from '../../components/AddWordForm';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WhiteButton from '../../components/WhiteButton';
import WordCard from '../../components/WordCard';
import { useWordActions } from '../../hooks/useWordActions';
import { useWordsContext } from '../../hooks/useWordsContext';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  handleWordUpdate,
  initializeRepeatState,
  type RepeatState,
} from '../../utils/repeatUtils';
import { saveTimerRecord } from '../../utils/timerRecords';
import styles from './TimerPage.module.scss';

const TIMER_OPTIONS = [1, 3, 5, 10] as const;

type TimerOption = (typeof TIMER_OPTIONS)[number];

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  totalSeconds: number;
}

const TimerPageContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { words } = useWordsContext();

  const { editingWord, handleEdit, clearEditingWord } = useWordActions();

  const [selectedTimer, setSelectedTimer] = useState<TimerOption | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    isFinished: false,
    totalSeconds: 0,
  });
  const [repeatState, setRepeatState] = useState<RepeatState | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [wordsCompleted, setWordsCompleted] = useState<Set<string>>(new Set());
  const wordsCompletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    wordsCompletedRef.current = wordsCompleted;
  }, [wordsCompleted]);

  useEffect(() => {
    if (timerState.timeLeft <= 0 && timerState.isRunning && !timerState.isFinished) {
      if (selectedTimer && wordsCompletedRef.current.size > 0) {
        saveTimerRecord(selectedTimer, wordsCompletedRef.current.size);
      }
      requestAnimationFrame(() => {
        setTimerState((prev) => ({ ...prev, isRunning: false, isFinished: true }));
      });
      return;
    }

    if (!timerState.isRunning || timerState.timeLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (prev.timeLeft <= 1) {
          if (selectedTimer && wordsCompletedRef.current.size > 0) {
            saveTimerRecord(selectedTimer, wordsCompletedRef.current.size);
          }
          return { ...prev, timeLeft: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft, timerState.isFinished, selectedTimer]);

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

  const handleStartTimer = useCallback(() => {
    if (!selectedTimer) {
      return;
    }

    const totalSeconds = selectedTimer * 60;
    const initialState = initializeRepeatState(words);

    setTimerState({
      timeLeft: totalSeconds,
      isRunning: true,
      isFinished: false,
      totalSeconds,
    });
    setRepeatState(initialState);
    setWordsCompleted(new Set());
  }, [selectedTimer, words]);

  const handleCorrect = useCallback(() => {
    if (!currentWord || !repeatState) {
      return;
    }

    const result = handleCorrectAnswer(currentWord, repeatState, words);
    setRepeatState(result.newState);
    setWordsCompleted((prev) => new Set(prev).add(currentWord.id));
  }, [currentWord, repeatState, words]);

  const handleIncorrect = useCallback(() => {
    if (!currentWord || !repeatState) {
      return;
    }

    const result = handleIncorrectAnswer(currentWord, repeatState);
    setRepeatState(result.newState);
  }, [currentWord, repeatState]);

  const handleEditWord = useCallback(
    (
      wordId: string,
      wordData: {
        ru: string;
        en: string;
        ko: string;
        translations: { ru: string; en: string; ko: string };
      }
    ) => {
      handleEdit(wordId, wordData);
      setShowEditForm(true);
    },
    [handleEdit]
  );

  const handleWordSaved = useCallback(
    (updatedWordData?: {
      id: string;
      data: {
        ru: string;
        en: string;
        ko: string;
        translations: { ru: string; en: string; ko: string };
      };
    }) => {
      if (!updatedWordData || !editingWord || !repeatState) {
        setShowEditForm(false);
        clearEditingWord();
        return;
      }

      const updatedWord = {
        id: updatedWordData.id,
        ru: updatedWordData.data.ru,
        en: updatedWordData.data.en,
        ko: updatedWordData.data.ko,
        translations: updatedWordData.data.translations,
      };

      const result = handleWordUpdate(editingWord.id, updatedWord, repeatState);
      setRepeatState(result.newState);
      setShowEditForm(false);
      clearEditingWord();
    },
    [editingWord, repeatState, clearEditingWord]
  );

  const handleCloseEditForm = useCallback(() => {
    setShowEditForm(false);
    clearEditingWord();
  }, [clearEditingWord]);

  const handleReset = useCallback(() => {
    setSelectedTimer(null);
    setTimerState({
      timeLeft: 0,
      isRunning: false,
      isFinished: false,
      totalSeconds: 0,
    });
    setRepeatState(null);
    setWordsCompleted(new Set());
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasWords = words.length > 0;

  if (!hasWords) {
    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <p>{t('noWords')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedTimer) {
    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.timerSelection}>
            <h2 className={styles.timerTitle}>{t('selectTimerDuration')}</h2>
            <div className={styles.timerOptions}>
              {TIMER_OPTIONS.map((minutes) => (
                <Button
                  key={minutes}
                  label={`${minutes} ${t('minute', { count: minutes })}`}
                  onClick={() => {
                    setSelectedTimer(minutes);
                  }}
                  className={styles.timerOption}
                />
              ))}
            </div>
            <WhiteButton
              onClick={() => navigate('/records')}
              icon="pi pi-sparkles"
              label={t('records')}
              className={styles.recordsButton}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (timerState.isFinished) {
    const totalWords = words.length;
    const completedCount = wordsCompleted.size;
    const remainingCount = totalWords - completedCount;

    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.finishedState}>
            <h2 className={styles.finishedTitle}>{t('timerFinished')}</h2>
            <p className={styles.encouragementText}>{t('greatJobKeepGoing')}</p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wordsCompleted')}</span>
                <span className={styles.statValue}>{completedCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wordsRemaining')}</span>
                <span className={styles.statValue}>{remainingCount}</span>
              </div>
            </div>
            <div className={styles.finishedActions}>
              <GradientButton
                icon="pi pi-refresh"
                label={t('startAgain')}
                onClick={handleReset}
                className={styles.resetButton}
              />
              <WhiteButton
                onClick={() => navigate('/records')}
                icon="pi pi-sparkles"
                label={t('records')}
                className={styles.recordsButton}
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (selectedTimer && !timerState.isRunning && !timerState.isFinished) {
    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.readyState}>
            <div className={styles.timerDisplay}>
              <span className={styles.timerText}>{formatTime(selectedTimer * 60)}</span>
            </div>
            <GradientButton
              icon="pi pi-play"
              label={t('startTimer')}
              onClick={handleStartTimer}
              className={styles.startButton}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
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
    <div className={styles.timerContainer}>
      <Header title={t('timer')} showNavigation={true} />
      <div className={styles.content}>
        <div className={styles.timerWrapper}>
          <div className={styles.timerDisplay}>
            <span className={styles.timerText}>{formatTime(timerState.timeLeft)}</span>
          </div>
        </div>
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
            showActions={true}
            onEdit={handleEditWord}
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
                current: wordsCompleted.size,
                total: words.length,
              })}
            </span>
          </div>
        </div>
      </div>
      <Footer />
      <AddWordForm
        visible={showEditForm}
        onHide={handleCloseEditForm}
        onWordAdded={handleWordSaved}
        editWordId={editingWord?.id}
        editWordData={editingWord?.data}
      />
    </div>
  );
};

const TimerPage = () => {
  const { t } = useTranslation();
  const { words, loading } = useWordsContext();
  const wordsKey = useMemo(() => words.map((w) => w.id).join(','), [words]);

  if (loading) {
    return (
      <div className={styles.timerContainer}>
        <Header title={t('timer')} showNavigation={true} />
        <div className={styles.content}>
          <div className={styles.loading}>
            <ProgressSpinner />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <TimerPageContent key={wordsKey} />;
};

export default TimerPage;
