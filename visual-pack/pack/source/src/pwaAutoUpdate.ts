const UPDATE_CHECK_INTERVAL_MS = 60_000;
const SERVICE_WORKER_URL = '/sw.js';

let updateCheckTimer: number | undefined;
let hasInstalledAutoUpdater = false;
let hasReloadedForControllerChange = false;
let shouldReloadForUpdate = false;

function reloadForFreshDeployment() {
  if (!shouldReloadForUpdate) return;
  if (hasReloadedForControllerChange) return;
  hasReloadedForControllerChange = true;
  window.location.reload();
}

function requestFreshServiceWorker(registration: ServiceWorkerRegistration | undefined) {
  if (!registration) return;
  registration.update().catch((error) => {
    console.warn('[PWA] Service worker update check failed:', error);
  });
}

function activateWaitingWorker(registration: ServiceWorkerRegistration | undefined) {
  const waitingWorker = registration?.waiting;
  if (!waitingWorker) return;
  if (!navigator.serviceWorker.controller) return;

  shouldReloadForUpdate = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

function watchInstallingWorker(registration: ServiceWorkerRegistration) {
  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        activateWaitingWorker(registration);
      }
    });
  });
}

export function installPwaAutoUpdate() {
  if (hasInstalledAutoUpdater) return;
  hasInstalledAutoUpdater = true;

  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', reloadForFreshDeployment);

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: '/' })
      .then((registration) => {
        const checkForUpdate = () => requestFreshServiceWorker(registration);

        activateWaitingWorker(registration);
        watchInstallingWorker(registration);
        checkForUpdate();

        if (updateCheckTimer === undefined) {
          updateCheckTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
        }

        window.addEventListener('focus', checkForUpdate);
        window.addEventListener('online', checkForUpdate);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service worker registration failed:', error);
      });
  });
}
