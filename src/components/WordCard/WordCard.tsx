import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './WordCard.module.scss';

interface WordData {
    ru: string;
    en: string;
    ko: string;
    translations: {
        ru: string;
        en: string;
        ko: string;
    };
}

interface WordCardProps {
    wordKey?: string;
    wordData?: WordData;
    wordId?: string;
    onEdit?: (wordId: string, wordData: WordData) => void;
    onDelete?: (wordId: string) => void;
    showActions?: boolean;
}

const WordCard = ({ wordKey, wordData, wordId, onEdit, onDelete, showActions = false }: WordCardProps) => {
    const { t, i18n } = useTranslation();
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    let currentWord: string;
    let translationsObj: Record<string, string> = {};

    if (wordData) {
        const currentLang = i18n.language || 'en';
        const langKey = currentLang as 'ru' | 'en' | 'ko';
        currentWord = wordData[langKey] || '';
        translationsObj = wordData.translations || {};
    } else if (wordKey) {
        const currentLang = i18n.language || 'en';
        currentWord = t(`words.${wordKey}.${currentLang}`);
        const translations = t(`words.${wordKey}.translations`, { returnObjects: true }) as Record<string, string> | string;
        translationsObj = typeof translations === 'object' && translations !== null ? translations : {};
    } else {
        currentWord = '';
    }

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (wordId && wordData && onEdit) {
            onEdit(wordId, wordData);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (wordId && onDelete) {
            onDelete(wordId);
        }
    };

    return (
        <div className={styles.cardContainer}>
            {showActions && wordId && (
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {onEdit && wordData && (
                        <button
                            className={styles.editButton}
                            onClick={handleEditClick}
                            aria-label={t('edit')}
                        >
                            <i className="pi pi-pencil" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className={styles.deleteButton}
                            onClick={handleDeleteClick}
                            aria-label={t('delete')}
                        >
                            <i className="pi pi-times" />
                        </button>
                    )}
                </div>
            )}
            <div className={styles.card} onClick={handleFlip}>
                <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
                    <div className={styles.cardFront}>
                        <div className={styles.word}>{currentWord || wordKey || ''}</div>
                    </div>
                    <div className={styles.cardBack}>
                        <div className={styles.translations}>
                            {Object.entries(translationsObj).map(([lang, translation]) => (
                                <div key={lang} className={styles.translation}>
                                    <span className={styles.langLabel}>{lang.toUpperCase()}:</span>
                                    <span className={styles.translationText}>{translation}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordCard;

