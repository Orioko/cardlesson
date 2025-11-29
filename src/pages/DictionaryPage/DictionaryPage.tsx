import { Dialog } from 'primereact/dialog';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WhiteButton from '../../components/WhiteButton';
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

  const adjustedFirst = useMemo(
    () => calculateAdjustedFirst(first, words.length),
    [first, words.length]
  );

  const paginatedWords = useMemo(() => getPaginatedItems(words, first, rows), [words, first, rows]);

  const handlePageChangeEvent = (event: { first: number; rows: number }) => {
    const newState = handlePageChange(event, words.length);
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

  return (
    <div className={styles.dictionaryContainer}>
      <Header title={t('myDictionary')} showNavigation={true} />
      <div className={styles.content}>
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
              totalRecords={words.length}
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
      <Dialog
        visible={Boolean(deletingWordId)}
        onHide={cancelDelete}
        header={t('confirmDelete')}
        modal
        className={styles.deleteDialog}
      >
        <div className={styles.deleteContent}>
          <p>{t('confirmDeleteMessage')}</p>
          <div className={styles.deleteActions}>
            <WhiteButton label={t('cancel')} onClick={cancelDelete} />
            <GradientButton label={t('delete')} onClick={handleConfirmDelete} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DictionaryPage;
