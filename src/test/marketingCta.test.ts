import { describe, expect, it } from 'vitest';
import { getMarketingCta } from '@/lib/marketingCta';

const signedInUser = {
  id: 'user-1',
  email: 'architect@firm.com',
  provider: 'supabase' as const,
};

describe('getMarketingCta', () => {
  it('returns auth path and Start Free when signed out', () => {
    const cta = getMarketingCta(null);
    expect(cta.to).toBe('/auth');
    expect(cta.primary).toBe('Start Free →');
    expect(cta.navPrimary).toBe('Start Free');
    expect(cta.secondary).toEqual({ to: '/features', label: 'See All Features' });
  });

  it('returns editor path and Open Editor when signed in', () => {
    const cta = getMarketingCta(signedInUser);
    expect(cta.to).toBe('/editor');
    expect(cta.primary).toBe('Open Editor →');
    expect(cta.navPrimary).toBe('Open Editor');
    expect(cta.secondary).toBeNull();
  });
});
