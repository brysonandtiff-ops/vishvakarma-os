import { createClient } from '@supabase/supabase-js';
import { planFromPriceId } from './stripeClient';
import type { StripeMetadataShape, StripeSubscriptionShape } from './stripeShapes';

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

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for billing.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isoFromUnix(seconds: number | null | undefined): string | undefined {
  if (!seconds) return undefined;
  return new Date(seconds * 1000).toISOString();
}

function mapSubscriptionStatus(status: string): BillingStatus {
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

function subscriptionCurrentPeriodEnd(
  subscription: StripeSubscriptionShape,
): number | null | undefined {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  if (periodEnds.length === 0) return undefined;
  return Math.max(...periodEnds);
}

function planFromSubscription(
  subscription: StripeSubscriptionShape,
  status: BillingStatus,
): BillingPlan {
  if (status === 'canceled' || status === 'none') return 'starter';

  const priceId = subscription.items.data[0]?.price?.id;
  const mapped = planFromPriceId(priceId);
  return mapped === 'starter' ? 'studio' : mapped;
}

function mapBillingRow(row: Record<string, unknown>): BillingRecord {
  return {
    id: String(row.id),
    plan: (row.plan as BillingPlan) ?? 'starter',
    status: (row.status as BillingStatus) ?? 'none',
    stripeCustomerId:
      typeof row.stripe_customer_id === 'string' ? row.stripe_customer_id : undefined,
    stripeSubscriptionId:
      typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : undefined,
    currentPeriodEnd:
      typeof row.current_period_end === 'string' ? row.current_period_end : undefined,
    trialEnd: typeof row.trial_end === 'string' ? row.trial_end : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  };
}

export async function getBillingRecord(userId: string): Promise<BillingRecord | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('billing').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBillingRow(data as Record<string, unknown>);
}

export async function upsertBillingRecord(
  userId: string,
  updates: Partial<Omit<BillingRecord, 'id'>>
): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const existing = await getBillingRecord(userId);

  const payload = {
    id: userId,
    plan: updates.plan ?? existing?.plan ?? 'starter',
    status: updates.status ?? existing?.status ?? 'none',
    stripe_customer_id: updates.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    stripe_subscription_id: updates.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
    current_period_end: updates.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null,
    trial_end: updates.trialEnd ?? existing?.trialEnd ?? null,
    updated_at: now,
  };

  const { error } = await admin.from('billing').upsert(payload);
  if (error) throw error;
}

export async function upsertBillingFromSubscription(
  userId: string,
  subscription: StripeSubscriptionShape,
  stripeCustomerId?: string
): Promise<void> {
  const status = mapSubscriptionStatus(subscription.status);
  const plan = planFromSubscription(subscription, status);

  await upsertBillingRecord(userId, {
    plan,
    status,
    stripeCustomerId:
      stripeCustomerId ??
      (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id),
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: isoFromUnix(subscriptionCurrentPeriodEnd(subscription)),
    trialEnd: isoFromUnix(subscription.trial_end),
  });
}

export async function resolveUserIdFromStripeMetadata(
  metadata: StripeMetadataShape | null | undefined
): Promise<string | null> {
  const supabaseUid = metadata?.supabaseUid?.trim();
  const firebaseUid = metadata?.firebaseUid?.trim();
  return supabaseUid || firebaseUid || null;
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('billing')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ? String(data.id) : null;
}
