import { useState } from 'react';
import type { WordInput } from '../types/word';
import { getUserId } from '../utils/localAuth';
import { deleteWord } from '../utils/wordsApi';

interface UseWordActionsProps {
  onWordUpdated?: () => void;
}

export const useWordActions = ({ onWordUpdated }: UseWordActionsProps = {}) => {
  const [editingWord, setEditingWord] = useState<{ id: string; data: WordInput } | null>(null);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

  const handleEdit = (wordId: string, wordData: WordInput) => {
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

    // Слово сразу пропадает из списка, а запрос идёт в фоне.
    if (onDeleteSuccess) {
      onDeleteSuccess(wordIdToDelete);
    }

    try {
      await deleteWord(wordIdToDelete);
    } catch (error) {
      console.error('Ошибка удаления слова на сервере:', error);
    } finally {
      // Перезагружаем словарь с сервера: при ошибке слово вернётся на место.
      if (onWordUpdated) {
        onWordUpdated();
      }
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
    clearEditingWord,
  };
};
