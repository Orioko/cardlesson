import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import DictionarySearch from '../../components/DictionarySearch';
import { useWordActions } from '../../hooks/useWordActions';
import { useWordsContext } from '../../hooks/useWordsContext';
import {
  adjustPaginationAfterAdd,
  adjustPaginationAfterDelete,
  calculateAdjustedFirst,
  getPaginatedItems,
  handlePageChange,
} from '../../utils/paginationUtils';
import { getTodayWordsCount } from '../../utils/wordDataHelpers';
import styles from './DictionaryPage.module.scss';

const DictionaryPage = () => {
  const { t } = useTranslation();

  const { words, loading, refreshWords } = useWordsContext();
  const {
    editingWord,
    deletingWordId,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    clearEditingWord,
  } = useWordActions({ onWordUpdated: refreshWords });

  const [showAddForm, setShowAddForm] = useState(false);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const totalWordsCount = words.length;

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return words;
    }

    return words.filter((word) => {
      const candidates = [
        word.ru,
        word.en,
        word.ko,
        word.translations?.ru,
        word.translations?.en,
        word.translations?.ko,
      ];

      return candidates.some((value) => {
        if (!value) {
          return false;
        }

        return value.toLowerCase().includes(query);
      });
    });
  }, [words, searchQuery]);

  const todayWordsCount = useMemo(() => getTodayWordsCount(words), [words]);

  const adjustedFirst = useMemo(
    () => calculateAdjustedFirst(first, filteredWords.length),
    [first, filteredWords.length]
  );

  const paginatedWords = useMemo(
    () => getPaginatedItems(filteredWords, first, rows),
    [filteredWords, first, rows]
  );

  const handlePageChangeEvent = (event: { first: number; rows: number }) => {
    const newState = handlePageChange(event, filteredWords.length);
    setFirst(newState.first);
    setRows(newState.rows);
  };

  const handleWordAdded = () => {
    const newFirst = adjustPaginationAfterAdd(first, words.length);
    setFirst(newFirst);
    refreshWords();
    clearEditingWord();
  };

  const handleEditWord = (
    wordId: string,
    wordData: {
      ru: string;
      en: string;
      ko: string;
      translations: { ru: string; en: string; ko: string };
    }
  ) => {
    handleEdit(wordId, wordData);
    setShowAddForm(true);
  };

  const handleConfirmDelete = async () => {
    await confirmDelete(() => {
      const newFirst = adjustPaginationAfterDelete(first, rows, words.length - 1);
      setFirst(newFirst);
      refreshWords();
    });
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    clearEditingWord();
  };

  const handleToggleSearch = () => {
    setIsSearchVisible((prevState) => {
      const nextState = !prevState;

      if (!nextState) {
        setSearchQuery('');
        setFirst(0);
      }

      return nextState;
    });
  };

  const handleStatsKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleSearch();
    }
  };

  return (
    <div className={styles.dictionaryContainer}>
      <Header title={t('myDictionary')} showNavigation={true} />
      <div className={styles.content}>
        <div className={styles.stats}>
          <span
            className={`${styles.statsItem} ${styles.statsItemButton}`}
            onClick={handleToggleSearch}
            role="button"
            tabIndex={0}
            onKeyDown={handleStatsKeyDown}
          >
            {t('totalWords', { count: totalWordsCount })}
          </span>
          <span className={styles.statsItem}>
            {t('wordsAddedToday', { count: todayWordsCount })}
          </span>
        </div>

        {isSearchVisible && (
          <div className={styles.search}>
            <DictionarySearch value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}

        <div className={styles.actions}>
          <GradientButton
            onClick={() => setShowAddForm(true)}
            icon="pi pi-plus"
            label={t('addNewWord')}
            className={styles.addButton}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>
            <ProgressSpinner />
          </div>
        ) : words.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('noWords')}</p>
          </div>
        ) : (
          <>
            <div className={styles.cardsContainer}>
              {paginatedWords.map((word) => (
                <WordCard
                  key={word.id}
                  wordId={word.id}
                  wordData={{
                    ru: word.ru,
                    en: word.en,
                    ko: word.ko,
                    translations: word.translations,
                  }}
                  showActions={true}
                  onEdit={handleEditWord}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <Paginator
              first={adjustedFirst}
              rows={rows}
              totalRecords={filteredWords.length}
              rowsPerPageOptions={[10, 20, 30]}
              onPageChange={handlePageChangeEvent}
              className={styles.paginator}
            />
          </>
        )}
      </div>
      <Footer />
      <AddWordForm
        visible={showAddForm}
        onHide={handleCloseAddForm}
        onWordAdded={handleWordAdded}
        editWordId={editingWord?.id}
        editWordData={editingWord?.data}
      />
      <ConfirmDialog
        visible={Boolean(deletingWordId)}
        onHide={cancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DictionaryPage;
