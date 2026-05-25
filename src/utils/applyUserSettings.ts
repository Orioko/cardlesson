import i18n from '../../i18n';
import { getAppLanguage } from './appLanguageStorage';
import { getUserId } from './localAuth';
import { migrateSharedLegacySettingsIfNeeded } from './userSettingsScope';

export const applyUserSettingsForCurrentUser = async (): Promise<void> => {
  const userId = getUserId();

  if (!userId) {
    return;
  }

  migrateSharedLegacySettingsIfNeeded();

  const appLanguage = getAppLanguage();

  if (i18n.language !== appLanguage) {
    await i18n.changeLanguage(appLanguage);
  }

  window.dispatchEvent(new CustomEvent('selectedLanguagesChanged'));
  window.dispatchEvent(new CustomEvent('frontCardLanguageChanged'));
};
