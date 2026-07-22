import { BILLING_PLANS, STUDIO_TRIAL_LABEL } from '@/config/billingPlans';
import type { BillingSubscription } from '@/types/billing';
import { billingPlanLabel } from '@/types/billing';

export type BillingBannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface BillingBannerMessage {
  variant: BillingBannerVariant;
  title: string;
  body: string;
}

export function resolveBillingBanner(options: {
  billing: BillingSubscription | null;
  loading: boolean;
  error: string | null;
}): BillingBannerMessage | null {
  if (options.loading) {
    return {
      variant: 'info',
      title: 'Checking billing status',
      body: 'Loading your current plan and subscription details.',
    };
  }

  if (options.error) {
    return {
      variant: 'error',
      title: 'Billing unavailable',
      body: options.error,
    };
  }

  const billing = options.billing;
  const planLabel = billingPlanLabel(billing);

  if (!billing || billing.plan === 'starter' || billing.status === 'none' || billing.status === 'canceled') {
    return {
      variant: 'info',
      title: 'Upgrade your workspace',
      body: `You are on ${planLabel}. Studio unlocks cloud save, export packages, and governance tools for ${BILLING_PLANS.studio.priceLabel} with a ${STUDIO_TRIAL_LABEL.toLowerCase()}.`,
    };
  }

  if (billing.status === 'past_due') {
    return {
      variant: 'warning',
      title: 'Payment action required',
      body: `Your ${planLabel} subscription has a past-due payment. Update billing to keep Studio and Enterprise features active.`,
    };
  }

  if (billing.status === 'trialing' && billing.trialEnd) {
    const trialEnd = new Date(billing.trialEnd).toLocaleDateString();
    return {
      variant: 'info',
      title: 'Studio trial active',
      body: `Your ${STUDIO_TRIAL_LABEL.toLowerCase()} ends on ${trialEnd}. Manage billing anytime to upgrade or cancel before renewal.`,
    };
  }

  if (billing.plan === 'enterprise') {
    return {
      variant: 'success',
      title: 'Enterprise plan active',
      body: 'Your firm workspace includes SSO, API access, and dedicated onboarding. Use Manage billing for invoices and seat changes.',
    };
  }

  return {
    variant: 'success',
    title: 'Studio plan active',
    body: `You are subscribed to ${BILLING_PLANS.studio.name} at ${BILLING_PLANS.studio.priceLabel}. Manage billing for invoices, upgrades, or cancellation.`,
  };
}
