import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { auth } from '../../firebase';
import { loadWordsFromCache } from '../../utils/wordsCache';
import { initializeWordsSync, syncWordsFromServer } from '../../utils/wordsSync';
import styles from './MainPage.module.scss';

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

interface MainPageProps {
    onNavigateToDictionary?: () => void;
}

const MainPage = ({ onNavigateToDictionary }: MainPageProps) => {
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

    return (
        <div className={styles.mainContainer}>
            <Header 
                title={t('mainTitle')} 
                showNavigation={true}
                onNavigateToDictionary={onNavigateToDictionary}
            />
            <div className={styles.cardsContainer}>
                {loading ? (
                    <div className={styles.loading}>{t('loading')}</div>
                ) : words.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{t('noWords')}</p>
                    </div>
                ) : (
                    words.map((word) => (
                        <WordCard
                            key={word.id}
                            wordId={word.id}
                            wordData={{
                                ru: word.ru,
                                en: word.en,
                                ko: word.ko,
                                translations: word.translations
                            }}
                        />
                    ))
                )}
            </div>
            <Footer />
        </div>
    );
};

export default MainPage;
