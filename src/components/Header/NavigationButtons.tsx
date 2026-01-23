import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import WhiteButton from '../WhiteButton';
import styles from './Header.module.scss';

interface NavigationButton {
  path: string;
  icon: string;
  labelKey: string;
}

interface NavigationButtonsProps {
  currentPath: string;
}

const navigationConfig: Record<string, NavigationButton[]> = {
  dictionary: [
    { path: '/repeat', icon: 'pi pi-refresh', labelKey: 'repeat' },
    { path: '/timer', icon: 'pi pi-clock', labelKey: 'timer' },
  ],
  repeat: [
    { path: '/timer', icon: 'pi pi-clock', labelKey: 'timer' },
    { path: '/', icon: 'pi pi-book', labelKey: 'myDictionary' },
  ],
  timer: [
    { path: '/repeat', icon: 'pi pi-refresh', labelKey: 'repeat' },
    { path: '/', icon: 'pi pi-book', labelKey: 'myDictionary' },
  ],
  records: [
    { path: '/repeat', icon: 'pi pi-refresh', labelKey: 'repeat' },
    { path: '/timer', icon: 'pi pi-clock', labelKey: 'timer' },
    { path: '/', icon: 'pi pi-book', labelKey: 'myDictionary' },
  ],
};

const getPageKey = (pathname: string): string => {
  if (pathname === '/' || pathname === '/dictionary') {
    return 'dictionary';
  }
  if (pathname === '/repeat') {
    return 'repeat';
  }
  if (pathname === '/timer') {
    return 'timer';
  }
  if (pathname === '/records') {
    return 'records';
  }
  return '';
};

const NavigationButtons = ({ currentPath }: NavigationButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pageKey = getPageKey(currentPath);
  const buttons = navigationConfig[pageKey] || [];

  if (buttons.length === 0) {
    return null;
  }

  return (
    <>
      {buttons.map((button) => (
        <WhiteButton
          key={button.path}
          onClick={() => navigate(button.path)}
          icon={button.icon}
          label={t(button.labelKey)}
          className={styles.navButton}
        />
      ))}
    </>
  );
};

export default NavigationButtons;
