import { isWithinServerHours, SERVER_HOURS_LABEL } from '../../../shared/constants/serverSchedule';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { dismissOfflineBanner, useOfflineBanner } from '../../api/connectivity';
import {
  getCurrentUser,
  getProfileAccounts,
  logoutAll,
  onAuthChange,
  switchToRegisteredUser,
  type LocalUser,
} from '../../utils/localAuth';
import GradientButton from '../GradientButton';
import LanguageSettings from '../LanguageSettings';
import WhiteButton from '../WhiteButton';
import styles from './Header.module.scss';
import NavigationButtons from './NavigationButtons';
import type { HeaderProps } from './types';

type ProfileAccountRow = {
  id: string;
  email: string;
};

const Header = ({ title, showExitButton = true, showNavigation = false }: HeaderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [authUser, setAuthUser] = useState<LocalUser | null>(() => getCurrentUser());
  const [profileAccounts, setProfileAccounts] = useState<ProfileAccountRow[]>([]);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const profileOverlayRef = useRef<OverlayPanel>(null);
  const headerRef = useRef<HTMLElement>(null);
  const showOfflineBanner = useOfflineBanner();

  useEffect(() => {
    return onAuthChange(setAuthUser);
  }, []);

  // Шапка зафиксирована сверху, а её высота зависит от ширины экрана (кнопки переносятся).
  // Реальная высота пишется в --header-height, и страницы отступают ровно на неё.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }
    const update = () => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${Math.ceil(header.getBoundingClientRect().height)}px`
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
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

  const otherProfileAccounts = useMemo(
    () => sortedProfileAccounts.filter((acc) => acc.id !== authUser?.id),
    [sortedProfileAccounts, authUser?.id]
  );

  const handleProfileMenuOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setProfileAccounts(getProfileAccounts());
    profileOverlayRef.current?.toggle(e);
  }, []);

  const handleSelectProfile = useCallback(async (userId: string) => {
    profileOverlayRef.current?.hide();
    try {
      await switchToRegisteredUser(userId);
    } catch (error) {
      // токен профиля истёк — он уже убран из списка, нужно войти в него заново
      console.error('Ошибка смены профиля:', error);
      setProfileAccounts(getProfileAccounts());
      window.alert(error instanceof Error ? error.message : 'Ошибка смены профиля');
    }
  }, []);

  const handleExitClick = useCallback(() => {
    profileOverlayRef.current?.hide();
    setShowExitDialog(true);
  }, []);

  const handleConfirmExit = async () => {
    try {
      await logoutAll();
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
      <header
        ref={headerRef}
        className={`${styles.header} ${showNavigation ? '' : styles.headerSimple}`}
      >
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
                  <div className={styles.profileOverlayBody}>
                    <div className={styles.profileCurrentSection}>
                      <span className={styles.profileCurrentAvatar}>
                        {(authUser.email ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <div className={styles.profileCurrentInfo}>
                        <span className={styles.profileCurrentEmail}>{authUser.email}</span>
                        <span className={styles.profileCurrentBadge}>{t('currentProfile')}</span>
                      </div>
                    </div>
                    {otherProfileAccounts.length > 0 ? (
                      <>
                        <div className={styles.profileOverlayDivider} />
                        <div className={styles.profileOverlayTitle}>{t('profiles')}</div>
                        {otherProfileAccounts.map((acc) => (
                          <Button
                            key={acc.id}
                            text
                            type="button"
                            className={styles.profileAccountRow}
                            onClick={() => handleSelectProfile(acc.id)}
                          >
                            <span className={styles.profileRowChip}>
                              {acc.email.charAt(0).toUpperCase()}
                            </span>
                            <span className={styles.profileRowEmail}>{acc.email}</span>
                          </Button>
                        ))}
                      </>
                    ) : null}
                    <div className={styles.profileOverlayDivider} />
                    <Button
                      text
                      type="button"
                      icon="pi pi-sign-out"
                      className={styles.profileSignOutAll}
                      label={t('exitAllAccounts')}
                      onClick={handleExitClick}
                    />
                  </div>
                </OverlayPanel>
              </div>
            )}
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
          </div>
        </div>
        {/* плашка внутри шапки: её высоту учитывает --header-height, контент не перекрывается */}
        {showOfflineBanner && (
          <div className={styles.offlineBanner} role="status">
            <span>
              {isWithinServerHours()
                ? t('offlineBanner')
                : t('offlineBannerOffHours', SERVER_HOURS_LABEL)}
            </span>
            <button
              type="button"
              className={styles.offlineBannerClose}
              onClick={dismissOfflineBanner}
              aria-label={t('close')}
            >
              <i className="pi pi-times" />
            </button>
          </div>
        )}
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
          <p>{t('confirmExitAllMessage')}</p>
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
