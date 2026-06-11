import { describe, expect, it } from 'vitest';
import { BILLING_PLANS, resolveExportTier, STUDIO_TRIAL_DAYS } from '@/config/billingPlans';

describe('billingPlans', () => {
  it('uses a 14-day Studio trial', () => {
    expect(STUDIO_TRIAL_DAYS).toBe(14);
  });

  it('charges Studio at $499/mo and Enterprise at $1,000/mo', () => {
    expect(BILLING_PLANS.studio.amountCents).toBe(49900);
    expect(BILLING_PLANS.enterprise.amountCents).toBe(100000);
    expect(BILLING_PLANS.starter.amountCents).toBe(0);
  });

  it('defaults local-only workspaces to studio entitlements', () => {
    expect(
      resolveExportTier({
        isConfigured: false,
        isSignedIn: false,
      })
    ).toBe('studio');
  });

  it('defaults signed-in users without subscription to starter', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: true,
        billingPlan: 'starter',
        billingStatus: 'none',
      })
    ).toBe('starter');
  });

  it('grants studio when billing record is active', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: true,
        billingPlan: 'studio',
        billingStatus: 'active',
      })
    ).toBe('studio');
  });

  it('grants studio during trial', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: true,
        billingPlan: 'studio',
        billingStatus: 'trialing',
      })
    ).toBe('studio');
  });

  it('grants enterprise when enterprise subscription is active', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: true,
        billingPlan: 'enterprise',
        billingStatus: 'active',
      })
    ).toBe('enterprise');
  });

  it('grants enterprise to co-owner emails without a billing record', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: true,
        email: 'ajkdentureventure@gmail.com',
        billingPlan: 'starter',
        billingStatus: 'none',
      })
    ).toBe('enterprise');
  });

  it('does not grant co-owner tier when signed out', () => {
    expect(
      resolveExportTier({
        isConfigured: true,
        isSignedIn: false,
        email: 'ajkdentureventure@gmail.com',
      })
    ).toBe('starter');
  });
});
