import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserId } from '../api/session';
import { saveSettings } from '../api/settingsApi';
import type { Lang } from '../components/WordCard/types';
import { getAppLanguage, saveAppLanguage } from '../utils/appLanguageStorage';
import { getFrontCardLanguage, saveFrontCardLanguage } from '../utils/frontCardLanguageStorage';
import { getSelectedLanguages, saveSelectedLanguages } from '../utils/selectedLanguagesStorage';
import { isBackupReminderEnabled, setBackupReminderLocal } from '../utils/wordsBackup';

interface UseLanguageSettingsReturn {
  selectedLangs: Lang[];
  frontCardLang: Lang | null;
  appLanguage: Lang;
  setFrontCardLang: (lang: Lang | null) => void;
  setAppLanguage: (lang: Lang) => void;
  backupReminder: boolean;
  setBackupReminder: (enabled: boolean) => void;
  handleLangToggle: (lang: Lang) => string | null;
  handleSave: () => boolean;
}

export const useLanguageSettings = (): UseLanguageSettingsReturn => {
  const { t, i18n } = useTranslation();
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(() => getSelectedLanguages());
  const [frontCardLang, setFrontCardLang] = useState<Lang | null>(() => getFrontCardLanguage());
  const [appLanguage, setAppLanguage] = useState<Lang>(() => getAppLanguage());
  const [backupReminder, setBackupReminder] = useState<boolean>(() => isBackupReminderEnabled());

  const handleLangToggle = useCallback(
    (lang: Lang): string | null => {
      if (selectedLangs.includes(lang)) {
        if (selectedLangs.length <= 2) {
          return t('minTwoLanguagesRequired');
        }
        setSelectedLangs(selectedLangs.filter((l) => l !== lang));
      } else {
        setSelectedLangs([...selectedLangs, lang]);
      }
      return null;
    },
    [selectedLangs, t]
  );

  const handleSave = useCallback((): boolean => {
    try {
      if (selectedLangs.length < 2) {
        return false;
      }

      saveSelectedLanguages(selectedLangs);
      saveFrontCardLanguage(frontCardLang);
      saveAppLanguage(appLanguage);
      setBackupReminderLocal(backupReminder);
      void i18n.changeLanguage(appLanguage);
      // Локальная копия уже обновлена — экран меняется сразу, а на сервер настройки уходят в фоне
      // (без связи — позже, когда она появится).
      const userId = getUserId();
      if (userId) {
        saveSettings(userId, {
          appLanguage,
          frontCardLanguage: frontCardLang,
          selectedLanguages: selectedLangs,
          backupReminder,
        }).catch((error) => console.error('Не удалось сохранить настройки на сервере:', error));
      }
      return true;
    } catch {
      return false;
    }
  }, [selectedLangs, frontCardLang, appLanguage, backupReminder, i18n]);

  return {
    selectedLangs,
    frontCardLang,
    appLanguage,
    setFrontCardLang,
    setAppLanguage,
    backupReminder,
    setBackupReminder,
    handleLangToggle,
    handleSave,
  };
};
