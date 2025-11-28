import { useTranslation } from 'react-i18next';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import WordCard from '../../components/WordCard';
import { useWords } from '../../hooks/useWords';
import styles from './MainPage.module.scss';

const MainPage = () => {
    const { t } = useTranslation();

    const { words, loading } = useWords();

    return (
        <div className={styles.mainContainer}>
            <Header 
                title={t('mainTitle')} 
                showNavigation={true}
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
