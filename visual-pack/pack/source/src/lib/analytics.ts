import { track } from '@vercel/analytics';

const CONSENT_KEY = 'vishvakarma-analytics-consent';

/**
 * Product-activation funnel milestones. Keep this list small and meaningful so the
 * funnel stays legible in the Vercel Analytics dashboard. Add a member here before
 * emitting a new event so call sites stay type-checked.
 */
export type AnalyticsEvent = 'sign_in_succeeded' | 'project_created' | 'project_exported';

export function hasAnalyticsConsent(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
}

/**
 * Records a funnel event. No-op without analytics consent. In dev it logs to the
 * console; in production it forwards to Vercel Analytics. Never throws — analytics
 * must never break the app.
 */
export function trackEvent(
  name: AnalyticsEvent | (string & {}),
  properties?: Record<string, string | number | boolean>,
) {
  if (!hasAnalyticsConsent()) return;
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, properties);
    return;
  }
  try {
    track(name, properties);
  } catch {
    // analytics is best-effort; swallow failures
  }
}
