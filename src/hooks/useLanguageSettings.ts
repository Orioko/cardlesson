import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../components/WordCard/types';
import { getAppLanguage, saveAppLanguage } from '../utils/appLanguageStorage';
import { getFrontCardLanguage, saveFrontCardLanguage } from '../utils/frontCardLanguageStorage';
import { getSelectedLanguages, saveSelectedLanguages } from '../utils/selectedLanguagesStorage';

interface UseLanguageSettingsReturn {
  selectedLangs: Lang[];
  frontCardLang: Lang | null;
  appLanguage: Lang;
  setFrontCardLang: (lang: Lang | null) => void;
  setAppLanguage: (lang: Lang) => void;
  handleLangToggle: (lang: Lang) => string | null;
  handleSave: () => boolean;
}

export const useLanguageSettings = (): UseLanguageSettingsReturn => {
  const { t, i18n } = useTranslation();
  const [selectedLangs, setSelectedLangs] = useState<Lang[]>(() => getSelectedLanguages());
  const [frontCardLang, setFrontCardLang] = useState<Lang | null>(() => getFrontCardLanguage());
  const [appLanguage, setAppLanguage] = useState<Lang>(() => getAppLanguage());

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
      void i18n.changeLanguage(appLanguage);
      return true;
    } catch {
      return false;
    }
  }, [selectedLangs, frontCardLang, appLanguage, i18n]);

  return {
    selectedLangs,
    frontCardLang,
    appLanguage,
    setFrontCardLang,
    setAppLanguage,
    handleLangToggle,
    handleSave,
  };
};
