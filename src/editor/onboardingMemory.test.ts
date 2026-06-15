import { afterEach, describe, expect, it } from 'vitest';
import {
  FRESH_SIGN_IN_KEY,
  consumeFreshSignIn,
  markFreshSignIn,
} from './onboardingMemory';

describe('onboardingMemory fresh sign-in flag', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('marks and consumes a one-time fresh sign-in flag', () => {
    expect(consumeFreshSignIn()).toBe(false);

    markFreshSignIn();
    expect(sessionStorage.getItem(FRESH_SIGN_IN_KEY)).toBe('1');
    expect(consumeFreshSignIn()).toBe(true);
    expect(consumeFreshSignIn()).toBe(false);
    expect(sessionStorage.getItem(FRESH_SIGN_IN_KEY)).toBeNull();
  });
});
