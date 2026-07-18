import { expandableId, type StripeInvoiceShape } from './stripeShapes';

export function getInvoiceSubscriptionId(invoice: StripeInvoiceShape): string | null {
  return expandableId(invoice.parent?.subscription_details?.subscription);
}
