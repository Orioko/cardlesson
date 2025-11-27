import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../firebase';
import { addWordToCache, loadWordsFromCache, removeWordFromCache, saveWordsToCache, updateWordInCache } from '../../utils/wordsCache';
import styles from './AddWordForm.module.scss';

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

interface AddWordFormProps {
    visible: boolean;
    onHide: () => void;
    onWordAdded?: () => void;
    editWordId?: string;
    editWordData?: WordData;
}

const AddWordForm = ({ visible, onHide, onWordAdded, editWordId, editWordData }: AddWordFormProps) => {
    const { t } = useTranslation();
    const [russianWord, setRussianWord] = useState('');
    const [englishWord, setEnglishWord] = useState('');
    const [koreanWord, setKoreanWord] = useState('');
    const [error, setError] = useState('');

    const isEditMode = Boolean(editWordId && editWordData);

    useEffect(() => {
        if (visible && editWordData) {
            setRussianWord(editWordData.ru || '');
            setEnglishWord(editWordData.en || '');
            setKoreanWord(editWordData.ko || '');
        } else if (!visible) {
            setRussianWord('');
            setEnglishWord('');
            setKoreanWord('');
        }
    }, [visible, editWordData]);

    const handleSubmit = async () => {
        if (!russianWord.trim() || !englishWord.trim() || !koreanWord.trim()) {
            setError(t('fillAllFields'));
            return;
        }

        if (!auth.currentUser) {
            setError(t('userNotAuthenticated'));
            return;
        }

        setError('');

        try {
            const wordData = {
                ru: russianWord.trim(),
                en: englishWord.trim(),
                ko: koreanWord.trim(),
                translations: {
                    ru: russianWord.trim(),
                    en: englishWord.trim(),
                    ko: koreanWord.trim()
                }
            };

            if (isEditMode && editWordId) {
                if (auth.currentUser) {
                    try {
                        updateWordInCache(auth.currentUser.uid, editWordId, wordData);
                    } catch (cacheError) {
                        console.error('Ошибка обновления кэша:', cacheError);
                    }
                }
                setRussianWord('');
                setEnglishWord('');
                setKoreanWord('');
                onHide();
                if (onWordAdded) {
                    onWordAdded();
                }
                updateDoc(doc(db, 'words', editWordId), wordData).catch((error) => {
                    console.error('Ошибка обновления слова в Firebase:', error);
                });
            } else {
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newWord = {
                    id: tempId,
                    ...wordData,
                    userId: auth.currentUser.uid,
                    createdAt: new Date()
                };

                if (auth.currentUser) {
                    try {
                        addWordToCache(auth.currentUser.uid, newWord);
                    } catch (cacheError) {
                        console.error('Ошибка обновления кэша:', cacheError);
                    }
                }

                setRussianWord('');
                setEnglishWord('');
                setKoreanWord('');
                onHide();
                if (onWordAdded) {
                    onWordAdded();
                }

                addDoc(collection(db, 'words'), {
                    ...wordData,
                    userId: auth.currentUser.uid,
                    createdAt: new Date()
                }).then((docRef) => {
                    if (auth.currentUser) {
                        try {
                            const cachedWords = loadWordsFromCache(auth.currentUser.uid) || [];
                            const wordIndex = cachedWords.findIndex((w) => w.id === tempId);
                            if (wordIndex !== -1) {
                                cachedWords[wordIndex] = {
                                    id: docRef.id,
                                    ...wordData,
                                    userId: auth.currentUser.uid,
                                    createdAt: new Date()
                                };
                                saveWordsToCache(auth.currentUser.uid, cachedWords);
                                if (onWordAdded) {
                                    onWordAdded();
                                }
                            }
                        } catch (cacheError) {
                            console.error('Ошибка обновления кэша:', cacheError);
                        }
                    }
                }).catch((error) => {
                    console.error('Ошибка сохранения слова в Firebase:', error);
                    if (auth.currentUser) {
                        try {
                            removeWordFromCache(auth.currentUser.uid, tempId);
                            if (onWordAdded) {
                                onWordAdded();
                            }
                        } catch (cacheError) {
                            console.error('Ошибка удаления из кэша:', cacheError);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка сохранения слова:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(isEditMode ? t('errorUpdatingWord') : t('errorAddingWord'));
            if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
                setError(t('permissionDenied') || 'Недостаточно прав для выполнения операции');
            }
        }
    };

    const handleClose = () => {
        setRussianWord('');
        setEnglishWord('');
        setKoreanWord('');
        setError('');
        onHide();
    };

    return (
        <Dialog
            visible={visible}
            onHide={handleClose}
            header={isEditMode ? t('editWord') : t('addNewWord')}
            className={styles.dialog}
            modal
        >
            <div className={styles.form}>
                {error && (
                    <Message severity="error" text={error} className={styles.message} />
                )}

                <div className={styles.field}>
                    <label htmlFor="russianWord" className={styles.label}>
                        {t('russianWord')}
                    </label>
                    <InputText
                        id="russianWord"
                        value={russianWord}
                        onChange={(e) => setRussianWord(e.target.value)}
                        className={styles.input}
                        placeholder={t('enterRussianWord')}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="englishWord" className={styles.label}>
                        {t('englishWord')}
                    </label>
                    <InputText
                        id="englishWord"
                        value={englishWord}
                        onChange={(e) => setEnglishWord(e.target.value)}
                        className={styles.input}
                        placeholder={t('enterEnglishWord')}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="koreanWord" className={styles.label}>
                        {t('koreanWord')}
                    </label>
                    <InputText
                        id="koreanWord"
                        value={koreanWord}
                        onChange={(e) => setKoreanWord(e.target.value)}
                        className={styles.input}
                        placeholder={t('enterKoreanWord')}
                    />
                </div>

                <div className={styles.actions}>
                    <Button
                        label={t('cancel')}
                        onClick={handleClose}
                        severity="secondary"
                        outlined
                    />
                    <Button
                        label={isEditMode ? t('saveWord') : t('addWord')}
                        onClick={handleSubmit}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default AddWordForm;

