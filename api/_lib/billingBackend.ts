import type Stripe from 'stripe';
import * as billingSupabase from './billingSupabase';

export type BillingRecord = billingSupabase.BillingRecord;

export async function getBillingRecord(userId: string): Promise<BillingRecord | null> {
  return billingSupabase.getBillingRecord(userId);
}

export async function upsertBillingRecord(
  userId: string,
  updates: Partial<Omit<BillingRecord, 'id'>>
): Promise<void> {
  return billingSupabase.upsertBillingRecord(userId, updates);
}

export async function upsertBillingFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  stripeCustomerId?: string
): Promise<void> {
  return billingSupabase.upsertBillingFromSubscription(userId, subscription, stripeCustomerId);
}

export async function resolveUserIdFromStripeMetadata(
  metadata: Stripe.Metadata | null | undefined
): Promise<string | null> {
  return billingSupabase.resolveUserIdFromStripeMetadata(metadata);
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  return billingSupabase.findUserIdByStripeCustomerId(customerId);
}
