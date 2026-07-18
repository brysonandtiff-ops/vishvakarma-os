import * as billingSupabase from './billingSupabase';
import type { StripeMetadataShape, StripeSubscriptionShape } from './stripeShapes';

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
  subscription: StripeSubscriptionShape,
  stripeCustomerId?: string
): Promise<void> {
  return billingSupabase.upsertBillingFromSubscription(userId, subscription, stripeCustomerId);
}

export async function resolveUserIdFromStripeMetadata(
  metadata: StripeMetadataShape | null | undefined
): Promise<string | null> {
  return billingSupabase.resolveUserIdFromStripeMetadata(metadata);
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  return billingSupabase.findUserIdByStripeCustomerId(customerId);
}
