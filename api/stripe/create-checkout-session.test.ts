import { describe, expect, it } from 'vitest';
import { parseCheckoutPlan } from './create-checkout-session';

describe('checkout plan validation', () => {
  it('defaults legacy clients to the studio plan', () => {
    expect(parseCheckoutPlan({})).toBe('studio');
  });

  it.each(['studio', 'enterprise'] as const)('accepts the supported plan: %s', (plan) => {
    expect(parseCheckoutPlan({ plan })).toBe(plan);
  });

  it.each(['starter', 'free', 'admin', 1, true, null])(
    'rejects unsupported or malformed plans: %s',
    (plan) => {
      expect(() => parseCheckoutPlan({ plan })).toThrow('Unsupported checkout plan');
    },
  );
});
