import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  logout,
  onAuthChange,
  switchToRegisteredUser,
  type LocalUser,
} from '../../utils/localAuth';
import { getUsersFromStorage } from '../../utils/userStorage';
import GradientButton from '../GradientButton';
import LanguageSettings from '../LanguageSettings';
import WhiteButton from '../WhiteButton';
import { languageOptions, type LanguageOption } from './constants';
import styles from './Header.module.scss';
import NavigationButtons from './NavigationButtons';
import type { HeaderProps } from './types';

type ProfileAccountRow = {
  id: string;
  email: string;
};

const Header = ({ title, showExitButton = true, showNavigation = false }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [authUser, setAuthUser] = useState<LocalUser | null>(() => getCurrentUser());
  const [profileAccounts, setProfileAccounts] = useState<ProfileAccountRow[]>([]);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const languageOverlayRef = useRef<OverlayPanel>(null);
  const profileOverlayRef = useRef<OverlayPanel>(null);

  useEffect(() => {
    return onAuthChange(setAuthUser);
  }, []);

  const sortedProfileAccounts = useMemo(() => {
    return [...profileAccounts].sort((a, b) => {
      if (a.id === authUser?.id) {
        return -1;
      }
      if (b.id === authUser?.id) {
        return 1;
      }
      return a.email.localeCompare(b.email);
    });
  }, [profileAccounts, authUser?.id]);

  const handleProfileMenuOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setProfileAccounts(getUsersFromStorage().map((u) => ({ id: u.id, email: u.email })));
    profileOverlayRef.current?.toggle(e);
  }, []);

  const handleSelectProfile = useCallback((userId: string) => {
    try {
      switchToRegisteredUser(userId);
      profileOverlayRef.current?.hide();
    } catch (error) {
      console.error('Ошибка смены профиля:', error);
    }
  }, []);

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

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.controls}>
            {showNavigation && <NavigationButtons currentPath={location.pathname} />}
            {showExitButton && authUser && (
              <div className={styles.profileSwitcher}>
                <Button
                  text
                  type="button"
                  onClick={handleProfileMenuOpen}
                  className={styles.profileMenuButton}
                  aria-label={t('profileMenu')}
                >
                  <div className={styles.profileMenuButtonContent}>
                    <span className={styles.profileAvatar}>
                      {(authUser.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <i className="pi pi-chevron-down" />
                  </div>
                </Button>
                <OverlayPanel ref={profileOverlayRef} className={styles.profileOverlay}>
                  <div className={styles.profileOverlayTitle}>{t('profiles')}</div>
                  {sortedProfileAccounts.map((acc) => {
                    const isActive = acc.id === authUser.id;

                    return (
                      <Button
                        key={acc.id}
                        text
                        type="button"
                        className={`${styles.profileAccountRow} ${isActive ? styles.profileAccountRowActive : ''}`}
                        onClick={() => handleSelectProfile(acc.id)}
                      >
                        <span className={styles.profileRowChip}>
                          {acc.email.charAt(0).toUpperCase()}
                        </span>
                        <span className={styles.profileRowEmail}>{acc.email}</span>
                        {isActive ? (
                          <i className={`pi pi-check ${styles.profileRowCheck}`} />
                        ) : null}
                      </Button>
                    );
                  })}
                </OverlayPanel>
              </div>
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
                onClick={handleExitClick}
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
      <Dialog
        visible={showExitDialog}
        onHide={handleCancelExit}
        header={t('confirmExit')}
        modal
        className={styles.exitDialog}
      >
        <div className={styles.exitContent}>
          <p>{t('confirmExitMessage')}</p>
          <div className={styles.exitActions}>
            <WhiteButton label={t('cancel')} onClick={handleCancelExit} />
            <GradientButton label={t('ExitUser')} onClick={handleConfirmExit} />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default Header;
