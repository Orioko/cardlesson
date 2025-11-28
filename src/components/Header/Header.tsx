import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { logout } from '../../utils/localAuth';
import WhiteButton from '../WhiteButton';
import { languageOptions } from './constants';
import styles from './Header.module.scss';
import type { HeaderProps } from './types';

const Header = ({ title, showExitButton = true, onNavigateToDictionary, onNavigateToMain, showNavigation = false }: HeaderProps) => {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (e: { value: string }) => {
        i18n.changeLanguage(e.value);
    };

    const handleExit = async () => {
        try {
            await logout();
            window.location.reload();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerContent}>
                <h1 className={styles.title}>{title}</h1>
                <div className={styles.controls}>
                    {showNavigation && (
                        <>
                            {onNavigateToMain && (
                                <WhiteButton
                                    onClick={onNavigateToMain}
                                    icon="pi pi-home"
                                    label={t('practice')}
                                    className={styles.navButton}
                                />
                            )}
                            {onNavigateToDictionary && (
                                <WhiteButton
                                    onClick={onNavigateToDictionary}
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

