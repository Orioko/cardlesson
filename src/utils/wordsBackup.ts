import { getUserScopedStorageKey } from './userSettingsScope';

// Еженедельная резервная копия слов в файл (настройка веб-версии).
// Включена ли она — хранится на сервере вместе с настройками профиля, а копия в localStorage
// нужна, чтобы читать её синхронно. Когда скачивали файл в последний раз — только в этом
// браузере: файл ведь сохраняется на этом устройстве.

export const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_MS = 24 * 60 * 60 * 1000;
export const BACKUP_REMINDER_EVENT = 'backupReminderChanged';

const REMINDER_KEY = 'backup_reminder';
const LAST_BACKUP_KEY = 'words_backup_last';
const SNOOZE_KEY = 'words_backup_snooze_until';

const readNumber = (baseKey: string): number => {
  const key = getUserScopedStorageKey(baseKey);
  const value = key ? Number(localStorage.getItem(key)) : 0;
  return Number.isFinite(value) ? value : 0;
};

const writeValue = (baseKey: string, value: string): void => {
  const key = getUserScopedStorageKey(baseKey);
  if (key) {
    localStorage.setItem(key, value);
  }
};

const notify = (): void => {
  window.dispatchEvent(new CustomEvent(BACKUP_REMINDER_EVENT));
};

export const isBackupReminderEnabled = (): boolean => {
  const key = getUserScopedStorageKey(REMINDER_KEY);
  return key ? localStorage.getItem(key) === '1' : false;
};

export const setBackupReminderLocal = (enabled: boolean): void => {
  writeValue(REMINDER_KEY, enabled ? '1' : '0');
  notify();
};

export const getLastBackupAt = (): number => readNumber(LAST_BACKUP_KEY);

// markBackupDone — файл со словами скачан (из напоминания или кнопкой «Скачать слова»).
export const markBackupDone = (): void => {
  writeValue(LAST_BACKUP_KEY, String(Date.now()));
  notify();
};

// snoozeBackupReminder — «Напомнить завтра».
export const snoozeBackupReminder = (): void => {
  writeValue(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  notify();
};

// isBackupDue — пора предложить копию: напоминание включено, с прошлой копии прошла неделя
// (или копии ещё не было) и пользователь не отложил напоминание.
export const isBackupDue = (now = Date.now()): boolean => {
  if (!isBackupReminderEnabled()) {
    return false;
  }
  const last = getLastBackupAt();
  return now - last >= BACKUP_INTERVAL_MS && now >= readNumber(SNOOZE_KEY);
};

export const backupFileName = (date = new Date()): string =>
  `cardlesson-words-${date.toISOString().slice(0, 10)}.json`;
