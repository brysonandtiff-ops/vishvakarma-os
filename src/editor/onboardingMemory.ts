export const ONBOARDING_DISMISSED_KEY = 'vishvakarma.os.onboardingDismissed.v1';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isOnboardingDismissed() {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';
}

export function dismissOnboarding() {
  if (!hasStorage()) return;
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
}
