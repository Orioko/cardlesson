import { useCallback, useState } from 'react';
import type { Word } from '../types/word';
import { transformToWord } from '../utils/wordDataHelpers';

interface UseWordEditProps {
  onWordSaved?: (updatedWord: Word) => void;
}

interface EditWordData {
  ru: string;
  en: string;
  ko: string;
  translations: { ru: string; en: string; ko: string };
}

export const useWordEdit = ({ onWordSaved }: UseWordEditProps = {}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWord, setEditingWord] = useState<{ id: string; data: EditWordData } | null>(null);

  const handleEditWord = useCallback((wordId: string, wordData: EditWordData) => {
    setEditingWord({ id: wordId, data: wordData });
    setShowEditForm(true);
  }, []);

  const handleWordSaved = useCallback(
    (updatedWordData?: { id: string; data: EditWordData }) => {
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
