import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { useWordActions } from '../../hooks/useWordActions';
import { useWordsContext } from '../../hooks/useWordsContext';
import {
  handleCorrectAnswer,
  handleIncorrectAnswer,
  handleWordUpdate,
  initializeRepeatState,
  resetRepeatState,
  type RepeatState,
} from '../../utils/repeatUtils';
import styles from './RepeatPage.module.scss';

const RepeatPageContent = () => {
  const { t } = useTranslation();
  const { words } = useWordsContext();

  const { editingWord, handleEdit, clearEditingWord } = useWordActions();

  const [repeatState, setRepeatState] = useState<RepeatState>(() => initializeRepeatState(words));
  const [showEditForm, setShowEditForm] = useState(false);

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
      if (!updatedWordData || !editingWord) {
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
