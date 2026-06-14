import { describe, expect, it } from 'vitest';
import { REGIONAL_INDICES, REGIONAL_INDICES_BY_ID, getRegionsForJurisdiction } from '@/data/cost/regionalIndices';
import { formatCurrency } from '@/utils/currencyFormat';

describe('regionalIndices', () => {
  it('includes AU and IN metro tiers', () => {
    expect(REGIONAL_INDICES_BY_ID.has('au-nsw-sydney')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('in-mumbai')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('in-bengaluru')).toBe(true);
    expect(REGIONAL_INDICES_BY_ID.has('in-national')).toBe(true);
  });

  it('filters regions by jurisdiction', () => {
    expect(getRegionsForJurisdiction('in').every((r) => r.jurisdiction === 'in')).toBe(true);
    expect(getRegionsForJurisdiction('au').every((r) => r.jurisdiction === 'au')).toBe(true);
  });

  it('keeps multipliers within sensible bounds', () => {
    for (const region of REGIONAL_INDICES) {
      expect(region.materialMultiplier).toBeGreaterThan(0.9);
      expect(region.materialMultiplier).toBeLessThan(1.3);
      expect(region.laborMultiplier).toBeGreaterThan(0.9);
      expect(region.laborMultiplier).toBeLessThan(1.3);
      expect(region.volatility).toBeGreaterThan(0);
      expect(region.volatility).toBeLessThan(0.3);
    }
  });
});

describe('currencyFormat', () => {
  it('formats INR with rupee symbol', () => {
    expect(formatCurrency(125000, 'INR')).toContain('₹');
  });
});
