import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import { computeSiteFitness } from '@/services/optimization/siteFitness';

describe('siteFitness', () => {
  it('computes site fitness with explainable sub-scores', () => {
    const result = computeSiteFitness(DEFAULT_BUILDING_REQUEST);

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.explanations).toHaveLength(5);
    for (const sub of result.explanations) {
      expect(sub.explanation.summary.length).toBeGreaterThan(0);
    }
  });

  it('penalizes steep slopes', () => {
    const flat = computeSiteFitness({ ...DEFAULT_BUILDING_REQUEST, parcel: { ...DEFAULT_BUILDING_REQUEST.parcel, slope: 0 } });
    const steep = computeSiteFitness({ ...DEFAULT_BUILDING_REQUEST, parcel: { ...DEFAULT_BUILDING_REQUEST.parcel, slope: 15 } });
    expect(steep.slopeSuitability).toBeLessThan(flat.slopeSuitability);
  });
});
