export const ONBOARDING_DISMISSED_KEY = 'vishvakarma.os.onboardingDismissed.v1';
export const FRESH_SIGN_IN_KEY = 'vishvakarma.os.freshSignIn.v1';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hasSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function isOnboardingDismissed() {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';
}

export function dismissOnboarding() {
  if (!hasStorage()) return;
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
}

/** Set when a user completes sign-in so the editor can skip first-run overlays once. */
export function markFreshSignIn() {
  if (!hasSessionStorage()) return;
  window.sessionStorage.setItem(FRESH_SIGN_IN_KEY, '1');
}

/** Returns true once after sign-in, then clears the flag. */
export function consumeFreshSignIn() {
  if (!hasSessionStorage()) return false;
  const fresh = window.sessionStorage.getItem(FRESH_SIGN_IN_KEY) === '1';
  if (fresh) {
    window.sessionStorage.removeItem(FRESH_SIGN_IN_KEY);
  }
  return fresh;
}
