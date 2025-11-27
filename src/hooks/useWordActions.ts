import { useState } from 'react';
import { getUserId } from '../utils/localAuth';
import { deleteWord } from '../utils/wordsApi';
import { removeWordFromCache } from '../utils/wordsCache';

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

interface UseWordActionsProps {
    onWordUpdated?: () => void;
}

export const useWordActions = ({ onWordUpdated }: UseWordActionsProps = {}) => {
    const [editingWord, setEditingWord] = useState<{ id: string; data: WordData } | null>(null);
    const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

    const handleEdit = (wordId: string, wordData: WordData) => {
        setEditingWord({ id: wordId, data: wordData });
    };

    const handleDelete = (wordId: string) => {
        setDeletingWordId(wordId);
    };

    const confirmDelete = async (onDeleteSuccess?: (wordId: string) => void) => {
        const userId = getUserId();
        if (!deletingWordId || !userId) {
            return;
        }

        const wordIdToDelete = deletingWordId;
        setDeletingWordId(null);

        try {
            removeWordFromCache(userId, wordIdToDelete);
            
            if (onDeleteSuccess) {
                onDeleteSuccess(wordIdToDelete);
            }
            
            if (onWordUpdated) {
                onWordUpdated();
            }
            
            deleteWord(wordIdToDelete).catch((error) => {
                console.error('Ошибка удаления слова на сервере:', error);
            });
        } catch (error) {
            console.error('Ошибка удаления слова:', error);
        }
    };

    const cancelDelete = () => {
        setDeletingWordId(null);
    };

    const clearEditingWord = () => {
        setEditingWord(null);
    };

    return {
        editingWord,
        deletingWordId,
        handleEdit,
        handleDelete,
        confirmDelete,
        cancelDelete,
        clearEditingWord
    };
};

