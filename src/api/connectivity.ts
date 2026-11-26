import { useSyncExternalStore } from 'react';

// Связь с сервером: client.ts отмечает каждый удачный и неудачный запрос,
// данные без связи берутся из сохранённой копии.
//
// Плашка «нет связи» не должна мешать: она появляется, когда связь пропала,
// сама скрывается через BANNER_AUTO_HIDE_MS или по крестику и снова показывается,
// только если связь вернулась и опять пропала (а не на каждом экране).
const BANNER_AUTO_HIDE_MS = 6000;

let offline = false;
let bannerVisible = false;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

const hideBanner = (): void => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (bannerVisible) {
    bannerVisible = false;
    notify();
  }
};

const reconnectListeners = new Set<() => void>();

// onReconnect — вызвать при восстановлении связи (для фоновой синхронизации).
export const onReconnect = (listener: () => void): (() => void) => {
  reconnectListeners.add(listener);
  return () => {
    reconnectListeners.delete(listener);
  };
};

export const setOffline = (value: boolean): void => {
  if (offline === value) {
    return;
  }
  offline = value;
  if (!value) {
    reconnectListeners.forEach((listener) => listener());
  }
  if (value) {
    bannerVisible = true;
    hideTimer = setTimeout(hideBanner, BANNER_AUTO_HIDE_MS);
    notify();
  } else {
    hideBanner();
    notify();
  }
};

export const isOffline = (): boolean => offline;

export const dismissOfflineBanner = (): void => hideBanner();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getBannerVisible = (): boolean => bannerVisible;

export const useIsOffline = (): boolean => useSyncExternalStore(subscribe, isOffline);

export const useOfflineBanner = (): boolean => useSyncExternalStore(subscribe, getBannerVisible);
