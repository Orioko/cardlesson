import { deleteDoc, doc } from 'firebase/firestore';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddWordForm from '../../components/AddWordForm';
import Footer from '../../components/Footer';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { auth, db } from '../../firebase';
import { loadWordsFromCache, removeWordFromCache } from '../../utils/wordsCache';
import { initializeWordsSync, syncWordsFromServer } from '../../utils/wordsSync';
import styles from './DictionaryPage.module.scss';

interface WordData {
    id: string;
    ru: string;
    en: string;
    ko: string;
    translations: {
        ru: string;
        en: string;
        ko: string;
    };
}

interface DictionaryPageProps {
    onNavigateToMain?: () => void;
}

const DictionaryPage = ({ onNavigateToMain }: DictionaryPageProps) => {
    const { t } = useTranslation();
    
    const getInitialWords = (): WordData[] => {
        if (!auth.currentUser) {
            return [];
        }
        const cachedWords = loadWordsFromCache(auth.currentUser.uid);
        return cachedWords !== null ? cachedWords : [];
    };

    const getInitialLoading = (): boolean => {
        if (!auth.currentUser) {
            return false;
        }
        const cachedWords = loadWordsFromCache(auth.currentUser.uid);
        return cachedWords === null || cachedWords.length === 0;
    };

    const [words, setWords] = useState<WordData[]>(getInitialWords);
    const [loading, setLoading] = useState<boolean>(getInitialLoading);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingWord, setEditingWord] = useState<{ id: string; data: { ru: string; en: string; ko: string; translations: { ru: string; en: string; ko: string } } } | null>(null);
    const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser) {
            return;
        }

        const cachedWords = loadWordsFromCache(auth.currentUser.uid);
        const hasCachedWords = cachedWords !== null && cachedWords.length > 0;

        const handleSyncComplete = (syncedWords: WordData[]) => {
            setWords(syncedWords);
            setLoading(false);
        };

        const cleanup = initializeWordsSync(auth.currentUser.uid, handleSyncComplete);

        if (!hasCachedWords) {
            syncWordsFromServer(auth.currentUser.uid).then((syncedWords) => {
                if (syncedWords) {
                    setWords(syncedWords);
                }
                setLoading(false);
            });
        } else {
            syncWordsFromServer(auth.currentUser.uid).then((syncedWords) => {
                if (syncedWords) {
                    setWords(syncedWords);
                }
            });
        }

        return cleanup;
    }, []);

    const handleWordAdded = () => {
        if (auth.currentUser) {
            const cachedWords = loadWordsFromCache(auth.currentUser.uid);
            if (cachedWords !== null) {
                setWords(cachedWords);
            }
        }
        setEditingWord(null);
    };

    const handleEdit = (wordId: string, wordData: { ru: string; en: string; ko: string; translations: { ru: string; en: string; ko: string } }) => {
        setEditingWord({ id: wordId, data: wordData });
        setShowAddForm(true);
    };

    const handleDelete = (wordId: string) => {
        setDeletingWordId(wordId);
    };

    const confirmDelete = async () => {
        if (!deletingWordId || !auth.currentUser) {
            return;
        }

        const wordIdToDelete = deletingWordId;
        setDeletingWordId(null);

        try {
            removeWordFromCache(auth.currentUser.uid, wordIdToDelete);
            setWords((prevWords) => prevWords.filter((w) => w.id !== wordIdToDelete));
            
            deleteDoc(doc(db, 'words', wordIdToDelete)).catch((error) => {
                console.error('Ошибка удаления слова на сервере:', error);
            });
        } catch (error) {
            console.error('Ошибка удаления слова:', error);
        }
    };

    const handleCloseAddForm = () => {
        setShowAddForm(false);
        setEditingWord(null);
    };

    return (
        <div className={styles.dictionaryContainer}>
            <Header 
                title={t('myDictionary')} 
                showNavigation={true}
                onNavigateToMain={onNavigateToMain}
            />
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
                    <div className={styles.loading}>{t('loading')}</div>
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
                                    translations: word.translations
                                }}
                                showActions={true}
                                onEdit={handleEdit}
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
                onHide={() => setDeletingWordId(null)}
                header={t('confirmDelete')}
                modal
                className={styles.deleteDialog}
            >
                <div className={styles.deleteContent}>
                    <p>{t('confirmDeleteMessage')}</p>
                    <div className={styles.deleteActions}>
                        <Button
                            label={t('cancel')}
                            onClick={() => setDeletingWordId(null)}
                            severity="secondary"
                            outlined
                        />
                        <Button
                            label={t('delete')}
                            onClick={confirmDelete}
                            severity="danger"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default DictionaryPage;

