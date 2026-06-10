import type Stripe from 'stripe';
import { getAdminFirestore } from './firebaseAdmin';
import { planFromPriceId } from './stripeClient';

export type BillingPlan = 'starter' | 'studio' | 'enterprise';
export type BillingStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export type BillingRecord = {
  id: string;
  plan: BillingPlan;
  status: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  updated_at: string;
};

const BILLING_COLLECTION = 'billing';

function isoFromUnix(seconds: number | null | undefined): string | undefined {
  if (!seconds) return undefined;
  return new Date(seconds * 1000).toISOString();
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): BillingStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'none';
  }
}

function planFromSubscription(
  subscription: Stripe.Subscription,
  status: BillingStatus
): BillingPlan {
  if (status === 'canceled' || status === 'none') {
    return 'starter';
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const mapped = planFromPriceId(priceId);
  return mapped === 'starter' ? 'studio' : mapped;
}

export async function getBillingRecord(userId: string): Promise<BillingRecord | null> {
  const doc = await getAdminFirestore().collection(BILLING_COLLECTION).doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data() ?? {};
  return {
    id: userId,
    plan: (data.plan as BillingPlan) ?? 'starter',
    status: (data.status as BillingStatus) ?? 'none',
    stripeCustomerId: data.stripeCustomerId as string | undefined,
    stripeSubscriptionId: data.stripeSubscriptionId as string | undefined,
    currentPeriodEnd: data.currentPeriodEnd as string | undefined,
    trialEnd: data.trialEnd as string | undefined,
    updated_at: (data.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function upsertBillingRecord(
  userId: string,
  updates: Partial<Omit<BillingRecord, 'id'>>
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getBillingRecord(userId);
  const merged: Record<string, unknown> = {
    id: userId,
    plan: existing?.plan ?? 'starter',
    status: existing?.status ?? 'none',
    ...updates,
    updated_at: now,
  };

  await getAdminFirestore().collection(BILLING_COLLECTION).doc(userId).set(merged, { merge: true });
}

export async function upsertBillingFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  stripeCustomerId?: string
): Promise<void> {
  const status = mapSubscriptionStatus(subscription.status);
  const plan = planFromSubscription(subscription, status);

  await upsertBillingRecord(userId, {
    plan,
    status,
    stripeCustomerId: stripeCustomerId ?? (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id),
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: isoFromUnix(subscription.current_period_end),
    trialEnd: isoFromUnix(subscription.trial_end),
  });
}

export async function resolveUserIdFromStripeMetadata(metadata: Stripe.Metadata | null | undefined): Promise<string | null> {
  const firebaseUid = metadata?.firebaseUid?.trim();
  return firebaseUid || null;
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const snapshot = await getAdminFirestore()
    .collection(BILLING_COLLECTION)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0]!.id;
}
