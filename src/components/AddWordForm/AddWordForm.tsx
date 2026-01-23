import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isDuplicateWordError } from '../../utils/errorHandlingUtils';
import { autoDistributeWords } from '../../utils/languageDetection';
import { getLanguageLabel, getLanguagePlaceholder } from '../../utils/languageLabels';
import { getUserId } from '../../utils/localAuth';
import { getSelectedLanguages } from '../../utils/selectedLanguagesStorage';
import { createWordInput } from '../../utils/wordDataHelpers';
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
      }, 0);
    } else if (!visible) {
      setTimeout(() => {
        setWordValues({
          ru: '',
          en: '',
          ko: '',
        });
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
      const wordData = createWordInput(distributed);

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

      if (isDuplicateWordError(error)) {
        setError(t('duplicateWordError') || 'Такое слово уже существует в словаре');
      } else if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          setError(t('permissionDenied') || 'Недостаточно прав для выполнения операции');
        } else {
          setError(isEditMode ? t('errorUpdatingWord') : t('errorAddingWord'));
        }
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
    setError('');
    onHide();
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
              {getLanguageLabel(lang, t)}
            </label>
            <InputText
              id={lang}
              value={wordValues[lang]}
              onChange={(e) => setWordValues({ ...wordValues, [lang]: e.target.value })}
              className={styles.input}
              placeholder={getLanguagePlaceholder(lang, t)}
            />
          </div>
        ))}

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
