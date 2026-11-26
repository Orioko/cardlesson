import type { Lang } from '../components/WordCard/types';
import { ApiError, apiRequest } from './client';

export interface ServerSettings {
  appLanguage: Lang;
  frontCardLanguage: Lang | null;
  selectedLanguages: Lang[];
  // раз в неделю предлагать скачать резервную копию слов (только веб)
  backupReminder?: boolean;
  // false — пользователь ещё не сохранял настройки, пришли значения по умолчанию
  saved?: boolean;
}

export const fetchSettings = (): Promise<ServerSettings> => apiRequest('GET', '/api/settings');

export const saveSettingsToServer = (
  settings: Omit<ServerSettings, 'saved'>
): Promise<ServerSettings> => apiRequest('PUT', '/api/settings', settings);

// Настройки, сохранённые без связи, лежат в браузере и досылаются при её появлении.
const pendingKey = (userId: string): string => `settings_pending_${userId}`;

// saveSettings — сохранить на сервере, а без связи отложить до её появления.
export const saveSettings = async (
  userId: string,
  settings: Omit<ServerSettings, 'saved'>
): Promise<void> => {
  try {
    await saveSettingsToServer(settings);
    localStorage.removeItem(pendingKey(userId));
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      localStorage.setItem(pendingKey(userId), JSON.stringify(settings));
      return;
    }
    throw error;
  }
};

// flushPendingSettings — дослать настройки, сохранённые без связи. true — отложенных нет.
export const flushPendingSettings = async (userId: string): Promise<boolean> => {
  const raw = localStorage.getItem(pendingKey(userId));
  if (!raw) {
    return true;
  }
  await saveSettings(userId, JSON.parse(raw) as Omit<ServerSettings, 'saved'>);
  return localStorage.getItem(pendingKey(userId)) === null;
};

// hasPendingSettings — есть ли настройки, сохранённые без связи.
export const hasPendingSettings = (userId: string): boolean =>
  localStorage.getItem(pendingKey(userId)) !== null;
