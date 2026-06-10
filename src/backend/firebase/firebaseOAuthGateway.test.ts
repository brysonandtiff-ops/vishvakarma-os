import { describe, expect, it } from 'vitest';
import {
  clearOAuthRedirectPending,
  consumeOAuthRedirectPending,
  formatAuthError,
  isEmbeddedAuthBrowser,
  isWebKitBrowser,
  markOAuthRedirectPending,
  shouldPreferRedirectFlow,
} from './firebaseOAuthGateway';

describe('isWebKitBrowser', () => {
  it('detects desktop Safari', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(isWebKitBrowser(ua)).toBe(true);
  });

  it('detects iPad Safari', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(isWebKitBrowser(ua)).toBe(true);
  });

  it('does not treat Chrome as WebKit', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(isWebKitBrowser(ua)).toBe(false);
  });

  it('does not treat Firefox as WebKit', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
    expect(isWebKitBrowser(ua)).toBe(false);
  });

  it('does not treat Edge as WebKit', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    expect(isWebKitBrowser(ua)).toBe(false);
  });
});

describe('isEmbeddedAuthBrowser', () => {
  it('detects Cursor embedded preview', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/1.0 Chrome/120.0.0.0 Safari/537.36';
    expect(isEmbeddedAuthBrowser(ua)).toBe(true);
  });

  it('does not treat Chrome as embedded', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(isEmbeddedAuthBrowser(ua)).toBe(false);
  });

  it('does not treat Playwright HeadlessChrome as embedded', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36';
    expect(isEmbeddedAuthBrowser(ua)).toBe(false);
  });
});

describe('oauth redirect pending marker', () => {
  it('tracks a recent redirect attempt', () => {
    clearOAuthRedirectPending();
    markOAuthRedirectPending();
    expect(consumeOAuthRedirectPending()).toBe(true);
    expect(consumeOAuthRedirectPending()).toBe(false);
  });
});

describe('shouldPreferRedirectFlow', () => {
  it('prefers redirect in browser environments', () => {
    expect(shouldPreferRedirectFlow()).toBe(true);
  });
});

describe('formatAuthError', () => {
  it('describes internal OAuth failures with actionable guidance', () => {
    const message = formatAuthError({ code: 'auth/internal-error' }).message;
    expect(message).toContain('could not complete');
    expect(message).not.toContain('Retrying');
    expect(message).toContain('Authorized domains');
  });
});
