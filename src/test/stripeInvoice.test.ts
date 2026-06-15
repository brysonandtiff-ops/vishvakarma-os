import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { getInvoiceSubscriptionId } from '../../api/_lib/stripeInvoice';

describe('getInvoiceSubscriptionId', () => {
  it('reads subscription id from invoice.parent.subscription_details', () => {
    const invoice = {
      parent: {
        type: 'subscription_details',
        subscription_details: {
          subscription: 'sub_123',
        },
      },
    } as Stripe.Invoice;

    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_123');
  });

  it('unwraps expanded subscription objects', () => {
    const invoice = {
      parent: {
        type: 'subscription_details',
        subscription_details: {
          subscription: { id: 'sub_456' },
        },
      },
    } as Stripe.Invoice;

    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_456');
  });

  it('returns null when parent subscription details are missing', () => {
    const invoice = { parent: { type: 'quote_details' } } as Stripe.Invoice;
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });
});
