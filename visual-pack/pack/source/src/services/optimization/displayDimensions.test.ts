import { describe, expect, it } from 'vitest';
import type { OptimizationCandidate, OptimizationScore } from '@/domain/optimization/types';
import {
  computeDisplayOverall,
  PRIMARY_DIMENSIONS,
  toDisplayScores,
} from '@/services/optimization/displayDimensions';

function buildScores(overrides: Partial<Record<string, number>>): OptimizationScore[] {
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

  return categories.map((category) => ({
    category,
    score: overrides[category] ?? 70,
    weight: 0.1,
    explanation: { summary: 'test', metrics: { value: 1 } },
  }));
}

function mockCandidate(id: string, scores: OptimizationScore[], overall: number): OptimizationCandidate {
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
      ...scores,
      {
        category: 'overall',
        score: overall,
        weight: 1,
        explanation: { summary: 'overall', metrics: {} },
      },
    ],
    overallScore: overall,
    rank: 1,
  };
}

describe('displayDimensions', () => {
  it('maps 8 internal scores to 6 primary dimensions', () => {
    const display = toDisplayScores(
      buildScores({
        compliance: 90,
        construction_cost: 80,
        natural_light: 60,
        energy: 70,
        circulation: 50,
        privacy: 75,
        resale: 85,
        buildability: 65,
      }),
    );

    expect(display).toHaveLength(6);
    expect(display.map((d) => d.dimension)).toEqual(PRIMARY_DIMENSIONS);
    expect(display.find((d) => d.dimension === 'energy')?.score).toBe(66);
    expect(display.find((d) => d.dimension === 'buildability')?.score).toBe(59);
  });

  it('preserves winner ordering when ranked by display overall', () => {
    const winner = mockCandidate('winner', buildScores({ energy: 95, natural_light: 90 }), 92);
    const runner = mockCandidate('runner', buildScores({ energy: 60, natural_light: 55 }), 78);

    expect(computeDisplayOverall(winner)).toBeGreaterThan(computeDisplayOverall(runner));
  });
});
