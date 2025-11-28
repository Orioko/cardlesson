import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WhiteButton from '../../components/WhiteButton';
import WordCard from '../../components/WordCard';
import { useWordActions } from '../../hooks/useWordActions';
import { useWordsContext } from '../../hooks/useWordsContext';
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

  const handleWordAdded = () => {
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
          <div className={styles.cardsContainer}>
            {words.map((word) => (
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
