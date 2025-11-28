import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../utils/localAuth';
import WhiteButton from '../WhiteButton';
import { languageOptions } from './constants';
import styles from './Header.module.scss';
import type { HeaderProps } from './types';

const Header = ({ title, showExitButton = true, showNavigation = false }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageChange = (e: { value: string }) => {
    i18n.changeLanguage(e.value);
  };

  const handleExit = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const isOnDictionaryPage = location.pathname === '/' || location.pathname === '/dictionary';
  const isOnRepeatPage = location.pathname === '/repeat';

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.controls}>
          {showNavigation && (
            <>
              {isOnDictionaryPage && (
                <WhiteButton
                  onClick={() => navigate('/repeat')}
                  icon="pi pi-refresh"
                  label={t('repeat')}
                  className={styles.navButton}
                />
              )}
              {isOnRepeatPage && (
                <WhiteButton
                  onClick={() => navigate('/')}
                  icon="pi pi-book"
                  label={t('myDictionary')}
                  className={styles.navButton}
                />
              )}
            </>
          )}
          <Dropdown
            value={i18n.language}
            options={languageOptions}
            onChange={handleLanguageChange}
            optionLabel="label"
            className={styles.languageSelect}
            placeholder={t('selectLanguage')}
          />
          {showExitButton && (
            <WhiteButton
              onClick={handleExit}
              icon="pi pi-times"
              label={t('ExitUser')}
              className={styles.exitButton}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
