const CONSENT_KEY = 'vishvakarma-analytics-consent';

export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function setAnalyticsConsent(granted: boolean) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
}

export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (!hasAnalyticsConsent()) return;
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, properties);
  }
}
