import { describe, expect, it } from 'vitest';
import {
  constantTimeSecretEquals,
  createStripeProofSignature,
} from '../../api/stripe/proof-webhook';

describe('Cloudflare Stripe proof primitives', () => {
  it('compares equal proof tokens without leaking length mismatches', () => {
    expect(constantTimeSecretEquals('proof-token-123', 'proof-token-123')).toBe(true);
    expect(constantTimeSecretEquals('proof-token-123', 'proof-token-456')).toBe(false);
    expect(constantTimeSecretEquals('short', 'longer-token')).toBe(false);
  });

  it('creates a Stripe-compatible v1 HMAC signature', () => {
    expect(
      createStripeProofSignature(
        '{"id":"evt_test"}',
        'whsec_test',
        1_700_000_000,
      ),
    ).toBe(
      't=1700000000,v1=14c4f43763339dcb1c15f41a1ff31a94f2f09f8de278f8b4392ca0d7cbcd257e',
    );
  });
});
