import { useCallback, useState } from 'react';
import type { Word, WordInput } from '../types/word';
import { transformToWord } from '../utils/words/wordDataHelpers';

interface UseWordEditProps {
  onWordSaved?: (updatedWord: Word) => void;
}

export const useWordEdit = ({ onWordSaved }: UseWordEditProps = {}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWord, setEditingWord] = useState<{ id: string; data: WordInput } | null>(null);

  const handleEditWord = useCallback((wordId: string, wordData: WordInput) => {
    setEditingWord({ id: wordId, data: wordData });
    setShowEditForm(true);
  }, []);

  const handleWordSaved = useCallback(
    (updatedWordData?: { id: string; data: WordInput }) => {
      if (!updatedWordData || !editingWord) {
        setShowEditForm(false);
        setEditingWord(null);
        return;
      }

      const updatedWord = transformToWord(updatedWordData.id, updatedWordData.data);

      if (onWordSaved) {
        onWordSaved(updatedWord);
      }

      setShowEditForm(false);
      setEditingWord(null);
    },
    [editingWord, onWordSaved]
  );

  const handleCloseEditForm = useCallback(() => {
    setShowEditForm(false);
    setEditingWord(null);
  }, []);

  return {
    showEditForm,
    editingWord,
    handleEditWord,
    handleWordSaved,
    handleCloseEditForm,
  };
};
