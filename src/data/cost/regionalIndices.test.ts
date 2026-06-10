import { describe, expect, it } from 'vitest';
import { REGIONAL_INDICES, REGIONAL_INDICES_BY_ID } from '@/data/cost/regionalIndices';

describe('regionalIndices', () => {
  it('includes AU metro and regional tiers', () => {
    expect(REGIONAL_INDICES_BY_ID.has('au-nsw-sydney')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('au-vic-melbourne')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('au-qld-brisbane')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('au-national')).toBe(true);
  });

  it('keeps multipliers within sensible bounds', () => {
    for (const region of REGIONAL_INDICES) {
      expect(region.materialMultiplier).toBeGreaterThan(0.9);
      expect(region.materialMultiplier).toBeLessThan(1.25);
      expect(region.laborMultiplier).toBeGreaterThan(0.9);
      expect(region.laborMultiplier).toBeLessThan(1.25);
      expect(region.volatility).toBeGreaterThan(0);
      expect(region.volatility).toBeLessThan(0.3);
    }
  });
});
