import { describe, expect, it } from 'vitest';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { normalizeBuildingRequest } from '@/ai/building-designer/generators/requirementsExtractor';
import { analyzeLot } from '@/services/lot-analysis/lotAnalysis';
import {
  buildLayoutOptionVariants,
  countDistinctLayouts,
  generateLayoutCandidates,
} from '@/planning/candidateGenerator';

describe('candidateGenerator', () => {
  const constraints = applyConstraints(
    analyzeLot(
      normalizeBuildingRequest({
        style: 'modern',
        bedrooms: 4,
        bathrooms: 2,
        garageSpaces: 2,
        levels: 1,
        parcel: { width: 24.5, depth: 24.5, area: 600, slope: 0, orientation: 'corner', cornerLot: true },
      }),
    ),
  );

  it('builds the requested number of layout option variants', () => {
    const variants = buildLayoutOptionVariants(20);
    expect(variants).toHaveLength(20);
    expect(new Set(variants.map((v) => v.packingStrategy)).size).toBeGreaterThan(1);
  });

  it('generates N unique layout candidates', () => {
    const candidates = generateLayoutCandidates(constraints, 20, true);
    expect(candidates).toHaveLength(20);
    expect(countDistinctLayouts(candidates)).toBeGreaterThan(1);
  });
});
