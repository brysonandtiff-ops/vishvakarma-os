import { describe, expect, it } from 'vitest';
import type { OptimizationBatch } from '@/domain/optimization/types';
import { buildOptimizationBatchRecord } from '@/backend/firebase/firestoreOptimizationGateway';

function mockBatch(): OptimizationBatch {
  return {
    id: 'batch-1',
    input: { prompt: '4-bed modern home', targetBudget: 450_000 },
    resolvedRequest: {
      style: 'modern',
      bedrooms: 4,
      bathrooms: 2,
      garageSpaces: 2,
      levels: 1,
      parcel: {
        width: 24.5,
        depth: 24.5,
        area: 600,
        slope: 0,
        orientation: 'north',
      },
    },
    siteFitness: {
      overall: 80,
      solarOrientation: 85,
      slopeSuitability: 75,
      accessEfficiency: 70,
      setbackUtilization: 80,
      openSpaceQuality: 78,
      explanations: [],
    },
    candidates: [
      {
        id: 'candidate-a',
        label: 'Family Focused',
        objective: 'family_focused',
        building: {
          complianceReport: { blocked: false, overall: 'pass' },
          costSummary: { total: 420_000, items: [] },
        } as OptimizationBatch['candidates'][0]['building'],
        scores: [],
        overallScore: 88,
        rank: 1,
      },
    ],
    winnerId: 'candidate-a',
    runnerUpId: 'candidate-b',
    report: {
      winnerId: 'candidate-a',
      runnerUpId: 'candidate-b',
      winnerLabel: 'Family Focused',
      runnerUpLabel: 'Budget Optimized',
      tradeoffs: [],
      riskAreas: [],
      estimatedCost: 420_000,
      complianceConfidence: 100,
      permitReady: true,
      moatGain: {
        score: 62,
        compositeScore: 70,
        decisionLift: 8,
        winnerMargin: 6,
        strategyDiversity: 55,
        permitConfidence: 100,
        explainabilityIndex: 90,
        valueImpactBand: 'defensible',
        valueImpactLabel: '$3M–8M',
        summary: 'Optimization moat active.',
      },
      generatedAt: '2026-06-10T00:00:00.000Z',
    },
    createdAt: '2026-06-10T00:00:00.000Z',
  };
}

describe('firestoreOptimizationGateway', () => {
  it('serializes batch into lean optimization record', () => {
    const record = buildOptimizationBatchRecord(mockBatch());

    expect(record.id).toBe('batch-1');
    expect(record.input.prompt).toBe('4-bed modern home');
    expect(record.candidateSummaries).toHaveLength(1);
    expect(record.moatGain.score).toBe(62);
    expect(record.candidateSummaries[0].permitReady).toBe(true);
  });
});
