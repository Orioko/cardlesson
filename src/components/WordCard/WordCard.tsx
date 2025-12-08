import { Button } from 'primereact/button';
import type { KeyboardEvent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGS } from './constants';
import type { Lang, WordCardProps } from './types';
import { pickDeterministic, pickRandom } from './utils';
import styles from './WordCard.module.scss';

const WordCard = ({
  wordKey,
  wordData,
  wordId,
  onEdit,
  onDelete,
  showActions = false,
  displayLang,
}: WordCardProps) => {
  const { t, i18n } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  const frontLang = useMemo(() => {
    if (displayLang && wordData?.[displayLang]?.trim()) {
      return displayLang;
    }
    if (!wordData) {
      return null;
    }
    const filled = LANGS.filter((l) => wordData[l]?.trim());
    if (filled.length === 0) {
      return null;
    }
    if (wordId) {
      return pickDeterministic(filled, wordId) || null;
    }
    return pickRandom(filled) || null;
  }, [wordData, displayLang, wordId]);

  const { front, back } = useMemo(() => {
    if (wordData) {
      const filled = LANGS.filter((l) => wordData[l]?.trim());
      if (!filled.length || !frontLang) {
        return { front: '', back: {} as Partial<Record<Lang, string>> };
      }

      const backEntries = LANGS.filter((l) => wordData[l]?.trim()).map(
        (l) => [l, wordData[l].trim()] as const
      );

      return {
        front: wordData[frontLang].trim(),
        back: Object.fromEntries(backEntries) as Partial<Record<Lang, string>>,
      };
    }

    if (wordKey) {
      const currentLang = (i18n.resolvedLanguage || i18n.language || 'en') as Lang;
      const frontText = t(`words.${wordKey}.${currentLang}`, { defaultValue: '' }) as string;

      const backTranslations = LANGS.reduce<Partial<Record<Lang, string>>>((acc, l) => {
        const translation = t(`words.${wordKey}.${l}`, { defaultValue: '' }) as string;
        if (translation) {
          acc[l] = translation;
        }
        return acc;
      }, {});

      return { front: frontText, back: backTranslations };
    }

    return { front: '', back: {} as Partial<Record<Lang, string>> };
  }, [wordData, wordKey, i18n.resolvedLanguage, i18n.language, t, frontLang]);

  const handleFlip = useCallback(() => {
    setIsFlipped((s) => !s);
  }, []);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleEdit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (wordId && wordData && onEdit) {
        onEdit(wordId, wordData);
      }
    },
    [wordId, wordData, onEdit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (wordId && onDelete) {
        onDelete(wordId);
      }
    },
    [wordId, onDelete]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip]
  );

  return (
    <div className={styles.cardContainer}>
      {showActions && wordId && (
        <div className={styles.actions} onClick={stopPropagation}>
          {onEdit && wordData && (
            <Button
              icon="pi pi-pencil"
              onClick={handleEdit}
              aria-label={t('edit')}
              title={t('edit')}
              className={styles.editButton}
              rounded
              text
              severity="secondary"
            />
          )}
          {onDelete && (
            <Button
              icon="pi pi-times"
              onClick={handleDelete}
              aria-label={t('delete')}
              title={t('delete')}
              className={styles.deleteButton}
              rounded
              text
              severity="danger"
            />
          )}
        </div>
      )}
      <div
        className={styles.card}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
          <div className={styles.cardFront}>
            <div className={styles.word}>{front || wordKey || ''}</div>
          </div>
          <div className={styles.cardBack}>
            <div className={styles.translations}>
              {(Object.keys(back) as Lang[]).map((lang) => (
                <div key={lang} className={styles.translation}>
                  <span className={styles.langLabel}>{lang.toUpperCase()}:</span>
                  <span className={styles.translationText}>{back[lang]}</span>
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
