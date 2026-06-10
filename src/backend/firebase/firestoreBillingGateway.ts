import {
  documentToRecord,
  getFirestoreDocument,
} from './firestoreRestClient';
import type { BillingSubscription } from '@/types/billing';

const BILLING_COLLECTION = 'billing';

const DEFAULT_BILLING: Partial<BillingSubscription> = {
  plan: 'starter',
  status: 'none',
};

export async function getFirestoreBilling(userId: string): Promise<BillingSubscription | null> {
  const document = await getFirestoreDocument(BILLING_COLLECTION, userId);
  if (!document) return null;
  return documentToRecord<BillingSubscription>(document, DEFAULT_BILLING);
}
