import { describe, expect, it } from 'vitest';
import { validateStripeRedirectUrl } from '@/services/billing/stripeCheckout';

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
