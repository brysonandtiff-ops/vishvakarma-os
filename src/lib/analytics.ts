const CONSENT_KEY = 'vishvakarma-analytics-consent';
export const ANALYTICS_CONSENT_EVENT = 'vish:analytics-consent-change';
export const ANALYTICS_EVENT = 'vish:analytics-event';

/**
 * Product-activation funnel milestones. Keep this list small and meaningful so the
 * funnel stays legible for any consent-aware analytics collector. Add a member
 * here before emitting a new event so call sites stay type-checked.
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
 * Publishes a provider-neutral browser event after consent. Cloudflare Web
 * Analytics is configured at the Pages project level, so application code must
 * not depend on a hosting-provider SDK.
 */
export function trackEvent(
  name: AnalyticsEvent | (string & {}),
  properties?: Record<string, string | number | boolean>,
) {
  if (!hasAnalyticsConsent()) return;
  if (import.meta.env.DEV) {
    console.info('[analytics]', name, properties);
  }

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_EVENT, { detail: { name, properties } }),
  );
}
