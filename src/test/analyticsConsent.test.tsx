import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsentAnalytics from '@/components/common/ConsentAnalytics';
import {
  getAnalyticsConsent,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from '@/lib/analytics';

const track = vi.fn();

vi.mock('@vercel/analytics', () => ({ track }));
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

describe('analytics consent boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
    track.mockReset();
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

  it('does not mount Vercel Analytics before opt-in', async () => {
    render(<ConsentAnalytics />);
    expect(screen.queryByTestId('vercel-analytics')).not.toBeInTheDocument();

    act(() => setAnalyticsConsent(true));
    expect(await screen.findByTestId('vercel-analytics')).toBeInTheDocument();

    act(() => setAnalyticsConsent(false));
    await waitFor(() => {
      expect(screen.queryByTestId('vercel-analytics')).not.toBeInTheDocument();
    });
  });

  it('does not emit custom events without consent', async () => {
    trackEvent('project_created', { source: 'test' });
    await Promise.resolve();
    expect(track).not.toHaveBeenCalled();

    setAnalyticsConsent(true);
    trackEvent('project_created', { source: 'test' });

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith('project_created', { source: 'test' });
    });
  });
});
