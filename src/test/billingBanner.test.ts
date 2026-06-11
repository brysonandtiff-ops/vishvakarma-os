import { describe, expect, it } from 'vitest';
import { resolveBillingBanner } from '@/components/billing/billingBannerMessage';

describe('resolveBillingBanner', () => {
  it('shows a loading message while billing is fetching', () => {
    const message = resolveBillingBanner({ billing: null, loading: true, error: null });
    expect(message?.title).toBe('Checking billing status');
  });

  it('surfaces billing load errors', () => {
    const message = resolveBillingBanner({
      billing: null,
      loading: false,
      error: 'Firestore unavailable',
    });
    expect(message?.variant).toBe('error');
    expect(message?.body).toContain('Firestore unavailable');
  });

  it('prompts starter users to upgrade', () => {
    const message = resolveBillingBanner({
      billing: { id: 'u1', plan: 'starter', status: 'none' },
      loading: false,
      error: null,
    });
    expect(message?.title).toBe('Upgrade your workspace');
    expect(message?.body).toContain('$499/month');
  });

  it('warns when a subscription is past due', () => {
    const message = resolveBillingBanner({
      billing: { id: 'u1', plan: 'studio', status: 'past_due' },
      loading: false,
      error: null,
    });
    expect(message?.variant).toBe('warning');
    expect(message?.title).toBe('Payment action required');
  });

  it('celebrates an active enterprise plan', () => {
    const message = resolveBillingBanner({
      billing: { id: 'u1', plan: 'enterprise', status: 'active' },
      loading: false,
      error: null,
    });
    expect(message?.variant).toBe('success');
    expect(message?.title).toBe('Enterprise plan active');
  });
});
