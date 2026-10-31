import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAnalyticsConsent,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from '@/lib/analytics';

const legacyAnalyticsPackage = `@${['ver', 'cel'].join('')}/analytics`;

describe('analytics consent boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('does not load the retired external analytics runtime or consent mount', () => {
    const analyticsSource = readFileSync(resolve(process.cwd(), 'src/lib/analytics.ts'), 'utf8');
    const mountSource = readFileSync(
      resolve(process.cwd(), 'src/components/common/ConsentAnalytics.tsx'),
      'utf8',
    );
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');

    expect(analyticsSource).not.toContain(legacyAnalyticsPackage);
    expect(mountSource).not.toContain(legacyAnalyticsPackage);
    expect(appSource).not.toContain('AnalyticsConsentBanner');
    expect(appSource).not.toContain('ConsentAnalytics');
  });

  it('does not emit or log custom events without consent', () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    trackEvent('project_created', { source: 'test' });
    expect(consoleInfo).not.toHaveBeenCalled();

    setAnalyticsConsent(true);
    trackEvent('project_created', { source: 'test' });

    if (import.meta.env.DEV) {
      expect(consoleInfo).toHaveBeenCalledWith('[analytics]', 'project_created', {
        source: 'test',
      });
    } else {
      expect(consoleInfo).not.toHaveBeenCalled();
    }
  });
});
