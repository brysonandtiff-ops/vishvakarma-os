const CONSENT_KEY = 'vishvakarma-analytics-consent';
export const ANALYTICS_CONSENT_EVENT = 'vish:analytics-consent-change';

/**
 * Product-activation funnel milestones. Keep this list small and type-checked.
 * External telemetry is intentionally disabled; S.I.R.E. proof must not depend
 * on a third-party analytics runtime.
 */
export type AnalyticsEvent = 'sign_in_succeeded' | 'project_created' | 'project_exported';

export function getAnalyticsConsent(): boolean | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === 'granted') return true;
    if (value === 'denied') return false;
    return null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === true;
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    // A blocked storage write must not enable analytics implicitly.
  }

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { granted } }),
  );
}

/**
 * Keeps existing funnel call sites safe while external analytics is disabled.
 * Development logs remain available after explicit consent; production emits
 * no third-party telemetry.
 */
export function trackEvent(
  name: AnalyticsEvent | (string & {}),
  properties?: Record<string, string | number | boolean>,
) {
  if (!hasAnalyticsConsent()) return;
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, properties);
  }
}
