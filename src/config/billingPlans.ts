import { isCoOwnerEmail } from './coOwners';
import { EXPORT_FORMAT_COUNT, EXPORT_FORMATS_LABEL } from './exportFormats';
import type { BillingStatus } from '../types/billing';

export type PlanTier = 'starter' | 'studio' | 'enterprise';

export interface BillingPlan {
  tier: PlanTier;
  name: string;
  priceLabel: string;
  amountCents: number;
  currency: 'usd';
  interval: 'month';
  trialDays?: number;
  desc: string;
  popular: boolean;
  selfServeCheckout: boolean;
  salesEmail?: string;
  features: readonly string[];
}

export const BILLING_PLANS: Record<PlanTier, BillingPlan> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    priceLabel: 'Free forever',
    amountCents: 0,
    currency: 'usd',
    interval: 'month',
    desc: 'For homeowners and students exploring their first floor plan',
    popular: false,
    selfServeCheckout: false,
    features: [
      '1 active project',
      '2D drafting tools',
      'Sacred 3D View (Standard mode)',
      `PNG export (+ ${EXPORT_FORMAT_COUNT - 1} more in Studio)`,
      'Local Draft recovery',
    ],
  },
  studio: {
    tier: 'studio',
    name: 'Studio',
    priceLabel: '$499/month',
    amountCents: 49900,
    currency: 'usd',
    interval: 'month',
    trialDays: 14,
    desc: 'For professional practices shipping client-ready deliverables',
    popular: true,
    selfServeCheckout: true,
    features: [
      'Unlimited projects',
      'Full 2D + Sacred 3D View',
      `Export Package (${EXPORT_FORMATS_LABEL})`,
      'Cloud Save (Supabase)',
      'Project Proof governance',
      'Vastu Harmony + Panchatattva scoring',
      'India NBC pre-check & INR cost regions',
      'Akasha Cast (semantic lens broadcasting)',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$1,000/month',
    amountCents: 100000,
    currency: 'usd',
    interval: 'month',
    desc: 'For firms needing SSO, API access, and unlimited seats',
    popular: false,
    selfServeCheckout: true,
    features: [
      'Everything in Studio',
      'SSO / SAML authentication',
      'API access',
      'Dedicated onboarding',
      'Custom template library',
      'Indian residential sample library',
      'Collaboration (planned)',
      'Akasha Cast role invites + evidence export',
    ],
  },
};

export const PRICING_TIERS = [
  BILLING_PLANS.starter,
  BILLING_PLANS.studio,
  BILLING_PLANS.enterprise,
] as const;

export const STUDIO_TRIAL_DAYS = BILLING_PLANS.studio.trialDays ?? 0;

export const STUDIO_TRIAL_LABEL = `${STUDIO_TRIAL_DAYS}-Day Free Trial`;

export function resolveExportTier(options: {
  isConfigured: boolean;
  isSignedIn: boolean;
  email?: string | null;
  billingPlan?: 'starter' | 'studio' | 'enterprise';
  billingStatus?: BillingStatus;
}): 'starter' | 'studio' | 'enterprise' {
  if (!options.isConfigured) {
    return 'studio';
  }

  if (!options.isSignedIn) {
    return 'starter';
  }

  if (isCoOwnerEmail(options.email)) {
    return 'enterprise';
  }

  const plan = options.billingPlan ?? 'starter';
  const status = options.billingStatus ?? 'none';
  const isActive = status === 'active' || status === 'trialing' || status === 'past_due';

  if (plan === 'enterprise' && isActive) {
    return 'enterprise';
  }

  if (plan === 'studio' && isActive) {
    return 'studio';
  }

  return 'starter';
}

export function planTierLabel(tier: PlanTier): string {
  return BILLING_PLANS[tier].name;
}
