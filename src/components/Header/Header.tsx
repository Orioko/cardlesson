import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../utils/localAuth';
import LanguageSettings from '../LanguageSettings';
import WhiteButton from '../WhiteButton';
import { languageOptions, type LanguageOption } from './constants';
import styles from './Header.module.scss';
import type { HeaderProps } from './types';

const Header = ({ title, showExitButton = true, showNavigation = false }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const languageOverlayRef = useRef<OverlayPanel>(null);

  const currentLanguageOption = useMemo(
    () => languageOptions.find((opt) => opt.value === i18n.language) || languageOptions[0],
    [i18n.language]
  );

  const handleLanguageChange = useCallback(
    (lang: LanguageOption) => {
      i18n.changeLanguage(lang.value);
      languageOverlayRef.current?.hide();
    },
    [i18n]
  );

  const handleLanguageButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    languageOverlayRef.current?.toggle(e);
  }, []);

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
    <>
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
            <div className={styles.languageSwitcher}>
              <Button text onClick={handleLanguageButtonClick} className={styles.languageButton}>
                <div className={styles.languageButtonContent}>
                  {(() => {
                    const FlagComponent = currentLanguageOption.flag;
                    return <FlagComponent className={styles.flagIcon} />;
                  })()}
                  <span className={styles.languageCode}>{currentLanguageOption.label}</span>
                  <i className="pi pi-chevron-down" />
                </div>
              </Button>
              <OverlayPanel ref={languageOverlayRef} className={styles.languageOverlay}>
                {languageOptions.map((lang) => {
                  const FlagComponent = lang.flag;
                  const isActive = currentLanguageOption.value === lang.value;
                  return (
                    <Button
                      key={lang.value}
                      text
                      className={`${styles.languageOption} ${isActive ? styles.active : ''}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      <div className={styles.flagOption}>
                        <FlagComponent className={styles.flagIcon} />
                        <span>{lang.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </OverlayPanel>
            </div>
            <Button
              icon="pi pi-cog"
              onClick={() => setShowLanguageSettings(true)}
              aria-label={t('languageSettings')}
              title={t('languageSettings')}
              className={styles.settingsButton}
              rounded
              text
              severity="secondary"
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
      <LanguageSettings
        visible={showLanguageSettings}
        onHide={() => setShowLanguageSettings(false)}
      />
    </>
  );
};

export default Header;
