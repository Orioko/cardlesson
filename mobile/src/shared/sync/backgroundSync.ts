import { AppState } from 'react-native';
import { isWithinServerHours, RETRY_PENDING_MS } from '../../../../shared/constants/serverSchedule';
import { fetchWords, wordsSync } from '../../api/wordsApi';
import { isOffline, onReconnect } from '../api/connectivity';
import { getCurrentUser } from '../api/session';
import { flushPendingSettings, hasPendingSettings } from '../storage/languageSettings';
import { flushPendingTimerRecords, hasPendingTimerRecords } from '../storage/timerRecords';

// Фоновая синхронизация: всё, что сделано без связи (слова, рекорды, настройки),
// уходит на сервер при запуске, при возвращении приложения на экран, после изменений
// и при восстановлении связи. Сервер по таймеру не опрашивается: повтор раз в RETRY_PENDING_MS
// только если есть неотправленные изменения и сейчас часы его работы (см. serverSchedule).

let running: Promise<void> | null = null;
const syncedListeners = new Set<() => void>();

// onSynced — экран словаря перечитывает данные после фоновой синхронизации.
export const onSynced = (listener: () => void): (() => void) => {
  syncedListeners.add(listener);
  return () => {
    syncedListeners.delete(listener);
  };
};

export const syncNow = (): Promise<void> => {
  if (!running) {
    running = (async () => {
      if (!(await getCurrentUser())) {
        return;
      }
      try {
        await fetchWords();
        if (!isOffline()) {
          await flushPendingTimerRecords();
          await flushPendingSettings();
          syncedListeners.forEach((listener) => listener());
        }
      } catch (error) {
        console.warn('Background sync failed:', error);
      }
    })().finally(() => {
      running = null;
    });
  }
  return running;
};

const hasPendingChanges = async (): Promise<boolean> => {
  if (!(await getCurrentUser())) {
    return false;
  }
  return (
    (await (await wordsSync()).pendingCount()) > 0 ||
    (await hasPendingTimerRecords()) ||
    (await hasPendingSettings())
  );
};

// startBackgroundSync запускается один раз после входа; возвращает функцию остановки.
export const startBackgroundSync = (): (() => void) => {
  void syncNow();

  const offReconnect = onReconnect(() => void syncNow());
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void syncNow();
    }
  });
  const retry = setInterval(() => {
    if (isOffline() && isWithinServerHours()) {
      void hasPendingChanges().then((pending) => {
        if (pending) {
          void syncNow();
        }
      });
    }
  }, RETRY_PENDING_MS);

  return () => {
    offReconnect();
    appState.remove();
    clearInterval(retry);
  };
};
