import i18n from '../../i18n';
import { getUserId } from '../api/session';
import { fetchSettings, flushPendingSettings, type ServerSettings } from '../api/settingsApi';
import { getAppLanguage } from './appLanguageStorage';
import { setBackupReminderLocal } from './wordsBackup';
import { getUserScopedStorageKey } from './userSettingsScope';

// Настройки хранятся на сервере, а в localStorage лежит их копия:
// экраны читают её синхронно (getSelectedLanguages и т.п.), как и раньше.
export const writeLocalSettings = (settings: ServerSettings): void => {
  const appKey = getUserScopedStorageKey('app_language');
  const frontKey = getUserScopedStorageKey('front_card_language');
  const langsKey = getUserScopedStorageKey('selected_languages');
  if (!appKey || !frontKey || !langsKey) {
    return;
  }
  localStorage.setItem(appKey, settings.appLanguage);
  localStorage.setItem(langsKey, JSON.stringify(settings.selectedLanguages));
  setBackupReminderLocal(Boolean(settings.backupReminder));
  if (settings.frontCardLanguage) {
    localStorage.setItem(frontKey, settings.frontCardLanguage);
  } else {
    localStorage.removeItem(frontKey);
  }
};

export const applyUserSettingsForCurrentUser = async (): Promise<void> => {
  const userId = getUserId();

  if (!userId) {
    return;
  }

  try {
    // сначала дослать настройки, сохранённые без связи: они новее серверных
    if (await flushPendingSettings(userId)) {
      writeLocalSettings(await fetchSettings());
    }
  } catch (error) {
    // нет связи с сервером — остаются настройки, сохранённые в браузере в прошлый раз
    console.error('Не удалось загрузить настройки с сервера:', error);
  }

  const appLanguage = getAppLanguage();

  if (i18n.language !== appLanguage) {
    await i18n.changeLanguage(appLanguage);
  }

  window.dispatchEvent(new CustomEvent('selectedLanguagesChanged'));
  window.dispatchEvent(new CustomEvent('frontCardLanguageChanged'));
};
