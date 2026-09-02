import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_EVENT,
  getAnalyticsConsent,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from '@/lib/analytics';

describe('analytics consent boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to no consent and stores explicit choices', () => {
    expect(getAnalyticsConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);

    setAnalyticsConsent(false);
    expect(getAnalyticsConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);

    setAnalyticsConsent(true);
    expect(getAnalyticsConsent()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('does not emit or log custom events without consent', () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT, listener);

    trackEvent('project_created', { source: 'test' });
    expect(listener).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();

    window.removeEventListener(ANALYTICS_EVENT, listener);
    consoleInfo.mockRestore();
  });

  it('publishes provider-neutral events after consent', () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT, listener);

    setAnalyticsConsent(true);
    trackEvent('project_created', { source: 'test' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      name: 'project_created',
      properties: { source: 'test' },
    });

    window.removeEventListener(ANALYTICS_EVENT, listener);
    consoleInfo.mockRestore();
  });

  it('has no hosting-provider analytics SDK dependency', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/analytics.ts'), 'utf8');
    expect(source).not.toContain('static.cloudflareinsights.com');
  });
});
