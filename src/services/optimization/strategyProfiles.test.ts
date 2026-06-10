import { describe, expect, it } from 'vitest';
import { getAllStrategies, STRATEGY_PROFILES } from '@/services/optimization/strategyProfiles';

describe('strategyProfiles', () => {
  it('defines exactly 5 unique strategy profiles', () => {
    expect(STRATEGY_PROFILES).toHaveLength(5);
    const objectives = STRATEGY_PROFILES.map((s) => s.objective);
    expect(new Set(objectives).size).toBe(5);
  });

  it('assigns unique layout seeds per profile', () => {
    const seeds = STRATEGY_PROFILES.map((s) => s.layoutSeed);
    expect(new Set(seeds).size).toBe(5);
  });

  it('returns all strategies via getAllStrategies', () => {
    expect(getAllStrategies()).toHaveLength(5);
  });
});
