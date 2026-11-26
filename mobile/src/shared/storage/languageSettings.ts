import i18n from 'i18next';
import { LANGS, type Lang } from '../../../../shared/types/lang';
import { ApiError, apiRequest } from '../api/client';
import { getStorageItem, removeStorageItem, setStorageItem } from './asyncStorage';

// Настройки хранятся на сервере (общие с веб-версией), а в AsyncStorage лежит их копия —
// экраны читают её, как и раньше.
interface ServerSettings {
  appLanguage: Lang;
  frontCardLanguage: Lang | null;
  selectedLanguages: Lang[];
  saved?: boolean;
}

const SELECTED_LANGUAGES_KEY = 'cardlesson_mobile_selected_languages';
const FRONT_CARD_LANGUAGE_KEY = 'cardlesson_mobile_front_card_language';
const APP_LANGUAGE_KEY = 'cardlesson_mobile_app_language';

export type AppLanguage = 'ru' | 'en';

export const getSelectedLanguages = async (): Promise<Lang[]> => {
  const stored = await getStorageItem<Lang[]>(SELECTED_LANGUAGES_KEY);

  if (!stored) {
    return LANGS;
  }

  const valid = stored.filter((lang) => LANGS.includes(lang));

  if (valid.length < 2) {
    return LANGS;
  }

  return valid;
};

export const saveSelectedLanguages = async (languages: Lang[]): Promise<void> => {
  const valid = languages.filter((lang) => LANGS.includes(lang));

  if (valid.length < 2) {
    throw new Error('MIN_TWO_LANGUAGES_REQUIRED');
  }

  await setStorageItem(SELECTED_LANGUAGES_KEY, valid);
};

export const getFrontCardLanguage = async (): Promise<Lang | null> => {
  const stored = await getStorageItem<Lang | null>(FRONT_CARD_LANGUAGE_KEY);

  if (!stored) {
    return null;
  }

  if (!LANGS.includes(stored)) {
    return null;
  }

  return stored;
};

export const saveFrontCardLanguage = async (language: Lang | null): Promise<void> => {
  await setStorageItem(FRONT_CARD_LANGUAGE_KEY, language);
};

export const getAppLanguage = async (): Promise<AppLanguage> => {
  const stored = await getStorageItem<AppLanguage>(APP_LANGUAGE_KEY);

  if (stored === 'ru' || stored === 'en') {
    return stored;
  }

  return 'ru';
};

export const saveAppLanguage = async (language: AppLanguage): Promise<void> => {
  await setStorageItem(APP_LANGUAGE_KEY, language);
};

// Настройки, сохранённые без связи, помечаются и уходят на сервер при её появлении.
const SETTINGS_DIRTY_KEY = 'cardlesson_mobile_settings_dirty';

// pushSettingsToServer отправляет локальные настройки на сервер (после «Сохранить» в настройках).
// Без связи не падает: ставит отметку, и фоновая синхронизация дошлёт настройки позже.
export const pushSettingsToServer = async (): Promise<void> => {
  const [selectedLanguages, frontCardLanguage, appLanguage] = await Promise.all([
    getSelectedLanguages(),
    getFrontCardLanguage(),
    getAppLanguage(),
  ]);
  try {
    await apiRequest('PUT', '/api/settings', { appLanguage, frontCardLanguage, selectedLanguages });
    await removeStorageItem(SETTINGS_DIRTY_KEY);
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      await setStorageItem(SETTINGS_DIRTY_KEY, true);
      return;
    }
    throw error;
  }
};

// flushPendingSettings — дослать настройки, сохранённые без связи.
export const flushPendingSettings = async (): Promise<void> => {
  if (await getStorageItem<boolean>(SETTINGS_DIRTY_KEY)) {
    await pushSettingsToServer();
  }
};

// pullSettingsFromServer вызывается после входа: настройки профиля с сервера становятся локальными.
// Если на сервере их ещё нет, туда уходят текущие настройки устройства.
export const pullSettingsFromServer = async (): Promise<void> => {
  // есть неотправленные локальные настройки — они новее серверных
  if (await getStorageItem<boolean>(SETTINGS_DIRTY_KEY)) {
    await flushPendingSettings().catch(() => undefined);
    return;
  }
  try {
    const remote = await apiRequest<ServerSettings>('GET', '/api/settings');
    if (!remote.saved) {
      await pushSettingsToServer();
      return;
    }
    await setStorageItem(SELECTED_LANGUAGES_KEY, remote.selectedLanguages);
    await setStorageItem(FRONT_CARD_LANGUAGE_KEY, remote.frontCardLanguage);
    // в мобильной версии интерфейс только на русском и английском
    if (remote.appLanguage === 'ru' || remote.appLanguage === 'en') {
      await setStorageItem(APP_LANGUAGE_KEY, remote.appLanguage);
      if (i18n.language !== remote.appLanguage) {
        await i18n.changeLanguage(remote.appLanguage);
      }
    }
  } catch (error) {
    // нет связи — остаются настройки устройства
    console.warn('Failed to load settings from server:', error);
  }
};

// hasPendingSettings — есть ли настройки, сохранённые без связи.
export const hasPendingSettings = async (): Promise<boolean> =>
  Boolean(await getStorageItem<boolean>(SETTINGS_DIRTY_KEY));
