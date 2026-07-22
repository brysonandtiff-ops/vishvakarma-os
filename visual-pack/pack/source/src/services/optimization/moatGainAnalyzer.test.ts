import { describe, expect, it } from 'vitest';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import type { CostIntelligenceReport } from '@/domain/cost/types';
import { analyzeMoatGain } from '@/services/optimization/moatGainAnalyzer';

function mockCandidate(
  id: string,
  overallScore: number,
  compliance = 90,
  withMetrics = true,
): OptimizationCandidate {
  const categories = [
    'compliance',
    'construction_cost',
    'natural_light',
    'energy',
    'circulation',
    'privacy',
    'resale',
    'buildability',
  ] as const;

  return {
    id,
    label: id,
    objective: 'family_focused',
    building: {
      complianceReport: {
        blocked: false,
        overall: 'pass',
        results: [],
        categories: [],
        auditedAt: '',
        projectName: 'test',
        projectId: 'test',
      },
      costSummary: { total: 400_000, items: [] },
    } as OptimizationCandidate['building'],
    scores: [
      ...categories.map((category) => ({
        category,
        score: category === 'compliance' ? compliance : overallScore,
        weight: 0.1,
        explanation: {
          summary: 'test',
          metrics: withMetrics ? { value: 1 } : {},
        },
      })),
      {
        category: 'overall',
        score: overallScore,
        weight: 1,
        explanation: { summary: 'overall', metrics: {} },
      },
    ],
    overallScore,
    rank: 1,
  };
}

const sampleIntelligence: CostIntelligenceReport = {
  scenarios: {
    expected: 420_000,
    bestCase: 380_000,
    worstCase: 490_000,
    median: 420_000,
    breakdown: [],
  },
  confidence: {
    score: 78,
    catalogCoverage: 100,
    supplierCoverage: 85,
    regionalMatch: true,
    dataFreshness: 100,
    scheduleCompleteness: 100,
    summary: 'High confidence',
  },
  risk: { level: 'low', contingencyPct: 5, drivers: [], varianceBand: 110_000 },
  regionId: 'au-nsw-sydney',
  regionLabel: 'NSW — Sydney metro',
  supplierStrategy: 'balanced',
  generatedAt: new Date().toISOString(),
};

describe('moatGainAnalyzer', () => {
  it('assigns defensible value band for strong winner separation', () => {
    const candidates = [
      mockCandidate('a', 92),
      mockCandidate('b', 78),
      mockCandidate('c', 74),
      mockCandidate('d', 70),
      mockCandidate('e', 68),
    ];
    const report = analyzeMoatGain(candidates, candidates[0], candidates[1], true);

    expect(report.score).toBeGreaterThanOrEqual(45);
    expect(report.compositeScore).toBeGreaterThan(0);
    expect(report.valueImpactBand).toBe('defensible');
    expect(report.valueImpactLabel).toBe('$3M–8M');
    expect(report.decisionLift).toBeGreaterThan(0);
    expect(report.winnerMargin).toBe(14);
  });

  it('includes costMoat when intelligence is provided', () => {
    const candidates = [mockCandidate('a', 85), mockCandidate('b', 80)];
    const winner = {
      ...candidates[0],
      building: {
        ...candidates[0].building,
        costSummary: {
          total: 420_000,
          items: [],
          intelligence: sampleIntelligence,
        },
      },
    };
    const report = analyzeMoatGain(candidates, winner, candidates[1], true, sampleIntelligence);

    expect(report.costMoat).toBeDefined();
    expect(report.costMoat?.valueImpactLabel).toBeTruthy();
    expect(report.compositeScore).toBeGreaterThanOrEqual(report.score);
  });

  it('assigns foundation value band when permit is blocked', () => {
    const candidates = [mockCandidate('a', 80), mockCandidate('b', 79)];
    const report = analyzeMoatGain(candidates, candidates[0], candidates[1], false);

    expect(report.permitConfidence).toBe(0);
    expect(report.valueImpactBand).toBe('foundation');
    expect(report.valueImpactLabel).toBe('$1M–3M');
  });
});
