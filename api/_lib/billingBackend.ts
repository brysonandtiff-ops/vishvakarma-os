import type Stripe from 'stripe';
import * as billingFirestore from './billingFirestore';
import * as billingSupabase from './billingSupabase';

export type BillingRecord = billingFirestore.BillingRecord;

function useSupabaseBilling() {
  const provider = (process.env.BACKEND_PROVIDER ?? process.env.VITE_BACKEND_PROVIDER ?? 'supabase')
    .trim()
    .toLowerCase();
  return provider !== 'firebase';
}

export async function getBillingRecord(userId: string): Promise<BillingRecord | null> {
  return useSupabaseBilling()
    ? billingSupabase.getBillingRecord(userId)
    : billingFirestore.getBillingRecord(userId);
}

export async function upsertBillingRecord(
  userId: string,
  updates: Partial<Omit<BillingRecord, 'id'>>
): Promise<void> {
  if (useSupabaseBilling()) {
    return billingSupabase.upsertBillingRecord(userId, updates);
  }
  return billingFirestore.upsertBillingRecord(userId, updates);
}

export async function upsertBillingFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  stripeCustomerId?: string
): Promise<void> {
  if (useSupabaseBilling()) {
    return billingSupabase.upsertBillingFromSubscription(userId, subscription, stripeCustomerId);
  }
  return billingFirestore.upsertBillingFromSubscription(userId, subscription, stripeCustomerId);
}

export async function resolveUserIdFromStripeMetadata(
  metadata: Stripe.Metadata | null | undefined
): Promise<string | null> {
  if (useSupabaseBilling()) {
    return billingSupabase.resolveUserIdFromStripeMetadata(metadata);
  }
  return billingFirestore.resolveUserIdFromStripeMetadata(metadata);
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  if (useSupabaseBilling()) {
    return billingSupabase.findUserIdByStripeCustomerId(customerId);
  }
  return billingFirestore.findUserIdByStripeCustomerId(customerId);
}
