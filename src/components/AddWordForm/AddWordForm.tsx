import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { autoDistributeWords } from '../../utils/languageDetection';
import { getUserId } from '../../utils/localAuth';
import { getSelectedLanguages } from '../../utils/selectedLanguagesStorage';
import { addWord, updateWord } from '../../utils/wordsApi';
import GradientButton from '../GradientButton';
import type { Lang } from '../WordCard/types';
import styles from './AddWordForm.module.scss';
import type { AddWordFormProps } from './types';

const AddWordForm = ({
  visible,
  onHide,
  onWordAdded,
  editWordId,
  editWordData,
}: AddWordFormProps) => {
  const { t } = useTranslation();
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(() => getSelectedLanguages());
  const [wordValues, setWordValues] = useState<Record<Lang, string>>({
    ru: '',
    en: '',
    ko: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const isEditMode = Boolean(editWordId && editWordData);

  useEffect(() => {
    const handleLanguagesChange = () => {
      const updatedLangs = getSelectedLanguages();
      setSelectedLangs(updatedLangs);
    };

    window.addEventListener('selectedLanguagesChanged', handleLanguagesChange);
    window.addEventListener('storage', handleLanguagesChange);

    return () => {
      window.removeEventListener('selectedLanguagesChanged', handleLanguagesChange);
      window.removeEventListener('storage', handleLanguagesChange);
    };
  }, []);

  useEffect(() => {
    if (visible && editWordData) {
      setTimeout(() => {
        setWordValues({
          ru: editWordData.ru || '',
          en: editWordData.en || '',
          ko: editWordData.ko || '',
        });
        setTags(editWordData.tags || []);
      }, 0);
    } else if (!visible) {
      setTimeout(() => {
        setWordValues({
          ru: '',
          en: '',
          ko: '',
        });
        setTags([]);
        setTagInput('');
      }, 0);
    }
  }, [visible, editWordData]);

  const handleSubmit = async () => {
    const filledFields = selectedLangs.filter((lang) => wordValues[lang]?.trim().length > 0).length;

    if (filledFields < 2) {
      setError(t('fillAtLeastTwoFields'));
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError(t('userNotAuthenticated'));
      return;
    }

    setError('');

    try {
      const distributed = autoDistributeWords(wordValues);

      const wordData = {
        ru: distributed.ru,
        en: distributed.en,
        ko: distributed.ko,
        translations: {
          ru: distributed.ru,
          en: distributed.en,
          ko: distributed.ko,
        },
        tags: tags.length > 0 ? tags : undefined,
      };

      if (isEditMode && editWordId) {
        await updateWord(editWordId, wordData);
      } else {
        await addWord(wordData);
      }

      setWordValues({
        ru: '',
        en: '',
        ko: '',
      });
      setTags([]);
      setTagInput('');
      onHide();

      if (onWordAdded) {
        if (isEditMode && editWordId) {
          onWordAdded({
            id: editWordId,
            data: wordData,
          });
        } else {
          onWordAdded();
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения слова:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage === 'DUPLICATE_WORD') {
        setError(t('duplicateWordError') || 'Такое слово уже существует в словаре');
      } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setError(t('permissionDenied') || 'Недостаточно прав для выполнения операции');
      } else {
        setError(isEditMode ? t('errorUpdatingWord') : t('errorAddingWord'));
      }
    }
  };

  const handleClose = () => {
    setWordValues({
      ru: '',
      en: '',
      ko: '',
    });
    setTags([]);
    setTagInput('');
    setError('');
    onHide();
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (tags.length < 3 && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getLangLabel = (lang: Lang): string => {
    const labels: Record<Lang, string> = {
      ru: t('russianWord'),
      en: t('englishWord'),
      ko: t('koreanWord'),
    };
    return labels[lang];
  };

  const getLangPlaceholder = (lang: Lang): string => {
    const placeholders: Record<Lang, string> = {
      ru: t('enterRussianWord'),
      en: t('enterEnglishWord'),
      ko: t('enterKoreanWord'),
    };
    return placeholders[lang];
  };

  const dialogKey = useMemo(() => {
    if (!visible) {
      return 'closed';
    }
    return `open-${editWordId || 'new'}-${JSON.stringify(getSelectedLanguages())}`;
  }, [visible, editWordId]);

  return (
    <Dialog
      key={dialogKey}
      visible={visible}
      onHide={handleClose}
      header={isEditMode ? t('editWord') : t('addNewWord')}
      className={styles.dialog}
      modal
      dismissableMask
    >
      <div className={styles.form}>
        {error && <Message severity="error" text={error} className={styles.message} />}

        {selectedLangs.map((lang) => (
          <div key={lang} className={styles.field}>
            <label htmlFor={lang} className={styles.label}>
              {getLangLabel(lang)}
            </label>
            <InputText
              id={lang}
              value={wordValues[lang]}
              onChange={(e) => setWordValues({ ...wordValues, [lang]: e.target.value })}
              className={styles.input}
              placeholder={getLangPlaceholder(lang)}
            />
          </div>
        ))}

        <div className={styles.field}>
          <label htmlFor="tags" className={styles.label}>
            {t('tags')} ({tags.length}/3)
          </label>
          <InputText
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className={styles.input}
            placeholder={t('enterTag')}
            disabled={tags.length >= 3}
          />
          {tags.length > 0 && (
            <div className={styles.tagsContainer}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={styles.tagRemove}
                    aria-label={t('removeTag')}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button label={t('cancel')} onClick={handleClose} severity="secondary" outlined />
          <GradientButton
            label={isEditMode ? t('saveWord') : t('addWord')}
            onClick={handleSubmit}
            className={styles.submitButton}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default AddWordForm;
