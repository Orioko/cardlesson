import { MultiSelect, type MultiSelectChangeEvent } from 'primereact/multiselect';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { useWordActions } from '../../hooks/useWordActions';
import { useWordsContext } from '../../hooks/useWordsContext';
import {
  adjustPaginationAfterAdd,
  adjustPaginationAfterDelete,
  calculateAdjustedFirst,
  getPaginatedItems,
  handlePageChange,
} from '../../utils/paginationUtils';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    words.forEach((word) => {
      if (word.tags && word.tags.length > 0) {
        word.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [words]);

  const filteredWords = useMemo(() => {
    if (selectedTags.length === 0) {
      return words;
    }
    return words.filter((word) => {
      if (!word.tags || word.tags.length === 0) {
        return false;
      }
      return selectedTags.some((selectedTag) => word.tags?.includes(selectedTag));
    });
  }, [words, selectedTags]);

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
    const newFirst = adjustPaginationAfterAdd(first, filteredWords.length);
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
      tags?: string[];
    }
  ) => {
    handleEdit(wordId, wordData);
    setShowAddForm(true);
  };

  const handleConfirmDelete = async () => {
    await confirmDelete(() => {
      const newFirst = adjustPaginationAfterDelete(first, rows, filteredWords.length - 1);
      setFirst(newFirst);
      refreshWords();
    });
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    setFirst(0);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    clearEditingWord();
  };

  return (
    <div className={styles.dictionaryContainer}>
      <Header title={t('myDictionary')} showNavigation={true} />
      <div className={styles.content}>
        {!loading && words.length > 0 && allTags.length > 0 && (
          <div className={styles.filters}>
            <label htmlFor="tags-filter" className={styles.filterLabel}>
              {t('filterByTags')}
            </label>
            <MultiSelect
              id="tags-filter"
              value={selectedTags}
              onChange={(e: MultiSelectChangeEvent) => handleTagsChange(e.value || [])}
              options={allTags}
              className={styles.tagsInput}
              placeholder={t('selectTags')}
              display="chip"
            />
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => handleTagsChange([])}
                className={styles.clearFilters}
              >
                {t('clearFilters')}
              </button>
            )}
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
            {filteredWords.length === 0 && selectedTags.length > 0 ? (
              <div className={styles.emptyState}>
                <p>{t('noWordsWithSelectedTags')}</p>
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
                        tags: word.tags,
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
