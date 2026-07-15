import { describe, expect, it } from 'vitest';
import {
  createBillingRequestId,
  validateStripeRedirectUrl,
} from '@/services/billing/stripeCheckout';

describe('validateStripeRedirectUrl', () => {
  it.each([
    'https://checkout.stripe.com/c/pay/cs_test_123',
    'https://billing.stripe.com/p/session/test_123',
    'https://custom.checkout.stripe.com/session/test_123',
  ])('accepts trusted HTTPS Stripe redirects: %s', (url) => {
    expect(validateStripeRedirectUrl(url)).toBe(url);
  });

  it.each([
    'http://checkout.stripe.com/c/pay/cs_test_123',
    'https://stripe.example.com/checkout',
    'https://checkout.stripe.com.evil.example/checkout',
    'https://user:password@checkout.stripe.com/checkout',
    'javascript:alert(1)',
  ])('rejects untrusted or credential-bearing redirects: %s', (url) => {
    expect(() => validateStripeRedirectUrl(url)).toThrow('untrusted redirect URL');
  });
});

describe('createBillingRequestId', () => {
  it('uses crypto.randomUUID when available', () => {
    const cryptoApi = {
      randomUUID: () => '8a9570d6-2e7f-462c-a7fc-bf607518bd1e',
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => array,
    } as unknown as Crypto;

    expect(createBillingRequestId(cryptoApi)).toBe(
      '8a9570d6-2e7f-462c-a7fc-bf607518bd1e',
    );
  });

  it('falls back to cryptographically generated hex for older browsers', () => {
    const cryptoApi = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
        const bytes = array as Uint8Array;
        bytes.forEach((_, index) => {
          bytes[index] = index;
        });
        return array;
      },
    } as unknown as Crypto;

    expect(createBillingRequestId(cryptoApi)).toBe(
      '000102030405060708090a0b0c0d0e0f',
    );
  });
});
