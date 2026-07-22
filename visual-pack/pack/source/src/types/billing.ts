export type BillingPlan = 'starter' | 'studio' | 'enterprise';
export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export interface BillingSubscription {
  id: string;
  plan: BillingPlan;
  status: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  updated_at?: string;
}

const ACTIVE_STATUSES: ReadonlySet<BillingStatus> = new Set(['active', 'trialing', 'past_due']);

function isActiveStatus(status: BillingStatus | undefined): boolean {
  return status != null && ACTIVE_STATUSES.has(status);
}

export function isStudioSubscription(billing: BillingSubscription | null | undefined): boolean {
  if (!billing) return false;
  return billing.plan === 'studio' && isActiveStatus(billing.status);
}

export function isEnterpriseSubscription(billing: BillingSubscription | null | undefined): boolean {
  if (!billing) return false;
  return billing.plan === 'enterprise' && isActiveStatus(billing.status);
}

export function isPaidSubscription(billing: BillingSubscription | null | undefined): boolean {
  return isStudioSubscription(billing) || isEnterpriseSubscription(billing);
}

export function billingPlanLabel(billing: BillingSubscription | null | undefined): string {
  if (!billing || billing.plan === 'starter' || billing.status === 'canceled' || billing.status === 'none') {
    return 'Starter';
  }

  if (billing.plan === 'enterprise') {
    if (billing.status === 'past_due') return 'Enterprise (past due)';
    return 'Enterprise';
  }

  if (billing.status === 'trialing') return 'Studio (trial)';
  if (billing.status === 'past_due') return 'Studio (past due)';
  if (billing.status === 'active') return 'Studio';

  return 'Starter';
}
