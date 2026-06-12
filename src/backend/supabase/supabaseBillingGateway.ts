import type { BillingSubscription } from '@/types/billing';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

const DEFAULT_BILLING: Partial<BillingSubscription> = {
  plan: 'starter',
  status: 'none',
};

function mapBillingRow(row: Record<string, unknown>): BillingSubscription {
  return {
    id: String(row.id),
    plan: (row.plan as BillingSubscription['plan']) ?? DEFAULT_BILLING.plan ?? 'starter',
    status: (row.status as BillingSubscription['status']) ?? DEFAULT_BILLING.status ?? 'none',
    stripeCustomerId: typeof row.stripe_customer_id === 'string' ? row.stripe_customer_id : undefined,
    stripeSubscriptionId:
      typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : undefined,
    currentPeriodEnd:
      typeof row.current_period_end === 'string' ? row.current_period_end : undefined,
    trialEnd: typeof row.trial_end === 'string' ? row.trial_end : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
}

export async function getSupabaseBilling(userId: string): Promise<BillingSubscription | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('billing').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBillingRow(data as Record<string, unknown>);
}

export async function upsertSupabaseBilling(
  userId: string,
  updates: Partial<Omit<BillingSubscription, 'id'>>
): Promise<BillingSubscription> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not available.');

  const existing = await getSupabaseBilling(userId);
  const now = new Date().toISOString();

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

  const { data, error } = await client.from('billing').upsert(payload).select('*').single();
  if (error) throw error;
  return mapBillingRow(data as Record<string, unknown>);
}
