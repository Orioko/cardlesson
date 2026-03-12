import { InputText } from 'primereact/inputtext';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DictionarySearch.module.scss';

type DictionarySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

const DictionarySearch = ({ value, onChange }: DictionarySearchProps) => {
  const { t } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.searchContainer}>
      <InputText
        value={value}
        onChange={handleChange}
        className={styles.searchInput}
        placeholder={t('searchWordsPlaceholder')}
        aria-label={t('searchWordsPlaceholder')}
      />
    </div>
  );
};

export default DictionarySearch;
