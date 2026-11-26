import { isWithinServerHours, RETRY_PENDING_MS } from '../../shared/constants/serverSchedule';
import { flushPendingTimerRecords, hasPendingTimerRecords } from '../utils/timerRecords';
import { fetchWords, wordsSync } from '../utils/wordsApi';
import { isOffline, onReconnect } from './connectivity';
import { getUserId } from './session';
import { flushPendingSettings, hasPendingSettings } from './settingsApi';

// Фоновая синхронизация: всё, что сделано без связи (слова, рекорды, настройки),
// уходит на сервер при возвращении на вкладку, при появлении сети, после изменений
// и при восстановлении связи. Сервер по таймеру не опрашивается: повтор раз в RETRY_PENDING_MS
// только если есть неотправленные изменения и сейчас часы его работы (см. serverSchedule).

let running: Promise<void> | null = null;
const syncedListeners = new Set<() => void>();

// onSynced — словарь на экране перечитывается после фоновой синхронизации.
export const onSynced = (listener: () => void): (() => void) => {
  syncedListeners.add(listener);
  return () => {
    syncedListeners.delete(listener);
  };
};

export const syncNow = (): Promise<void> => {
  if (!running) {
    running = (async () => {
      const userId = getUserId();
      if (!userId) {
        return;
      }
      try {
        await fetchWords();
        if (!isOffline()) {
          await flushPendingTimerRecords();
          await flushPendingSettings(userId);
          syncedListeners.forEach((listener) => listener());
        }
      } catch (error) {
        console.error('Фоновая синхронизация не удалась:', error);
      }
    })().finally(() => {
      running = null;
    });
  }
  return running;
};

// startBackgroundSync запускается один раз при старте приложения; возвращает функцию остановки.
export const startBackgroundSync = (): (() => void) => {
  const offReconnect = onReconnect(() => void syncNow());
  const onOnline = () => void syncNow();
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      void syncNow();
    }
  };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  const retry = window.setInterval(() => {
    const userId = getUserId();
    if (!userId || !isOffline() || !isWithinServerHours()) {
      return;
    }
    void wordsSync()
      .pendingCount()
      .then((words) => {
        if (words > 0 || hasPendingTimerRecords() || hasPendingSettings(userId)) {
          void syncNow();
        }
      });
  }, RETRY_PENDING_MS);

  return () => {
    offReconnect();
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(retry);
  };
};
