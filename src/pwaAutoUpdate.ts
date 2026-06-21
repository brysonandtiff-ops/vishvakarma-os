import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60_000;

let updateCheckTimer: number | undefined;
let hasInstalledAutoUpdater = false;
let hasReloadedForControllerChange = false;

function requestFreshServiceWorker(registration: ServiceWorkerRegistration | undefined) {
  if (!registration) return;
  registration.update().catch((error) => {
    console.warn('[PWA] Service worker update check failed:', error);
  });
}

function reloadForFreshDeployment() {
  if (hasReloadedForControllerChange) return;
  hasReloadedForControllerChange = true;
  window.location.reload();
}

export function installPwaAutoUpdate() {
  if (hasInstalledAutoUpdater) return;
  hasInstalledAutoUpdater = true;

  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', reloadForFreshDeployment);

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateServiceWorker(true);
    },
    onRegisteredSW(_swUrl, registration) {
      const checkForUpdate = () => requestFreshServiceWorker(registration);
      checkForUpdate();

      if (updateCheckTimer === undefined) {
        updateCheckTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      }

      window.addEventListener('focus', checkForUpdate);
      window.addEventListener('online', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration failed:', error);
    },
  });
}
