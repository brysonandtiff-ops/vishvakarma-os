import { describe, expect, it } from 'vitest';
import type { OptimizationCandidate, OptimizationReport } from '@/domain/optimization/types';
import { buildDecisionBullets, buildDecisionHeadline } from '@/services/optimization/buildDecisionBullets';

function mockCandidate(
  id: string,
  objective: OptimizationCandidate['objective'],
  scores: OptimizationCandidate['scores'],
): OptimizationCandidate {
  return {
    id,
    label: id,
    objective,
    building: {
      complianceReport: { blocked: false, overall: 'pass', results: [] },
      costSummary: { total: 400_000, items: [] },
    } as OptimizationCandidate['building'],
    scores,
    overallScore: 85,
    rank: 1,
  };
}

function mockReport(overrides: Partial<OptimizationReport> = {}): OptimizationReport {
  return {
    winnerId: 'winner',
    runnerUpId: 'runner',
    winnerLabel: 'Winner',
    runnerUpLabel: 'Runner',
    tradeoffs: [
      {
        dimension: 'Cost',
        direction: 'improves',
        detail: 'Cost improves by 12 points (88 vs 76).',
      },
      {
        dimension: 'Energy',
        direction: 'worsens',
        detail: 'Energy is 8 points lower (70 vs 78).',
      },
    ],
    riskAreas: ['Construction cost exceeds target or batch median.'],
    estimatedCost: 420_000,
    complianceConfidence: 95,
    permitReady: true,
    moatGain: {
      score: 60,
      compositeScore: 65,
      decisionLift: 10,
      winnerMargin: 8,
      strategyDiversity: 50,
      permitConfidence: 95,
      explainabilityIndex: 90,
      valueImpactBand: 'defensible',
      valueImpactLabel: '$3M–8M',
      summary: 'Optimization moat active ($3M–8M). Winner leads by 8 pts with 10 pt lift.',
    },
    generatedAt: '2026-06-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildDecisionBullets', () => {
  it('builds pros from improving tradeoffs and weighted category wins', () => {
    const winner = mockCandidate('winner', 'budget_optimized', [
      { category: 'construction_cost', score: 92, weight: 0.25, explanation: { summary: '', metrics: {} } },
      { category: 'compliance', score: 90, weight: 0.15, explanation: { summary: '', metrics: {} } },
      { category: 'overall', score: 88, weight: 1, explanation: { summary: '', metrics: {} } },
    ]);
    const runnerUp = mockCandidate('runner', 'family_focused', [
      { category: 'construction_cost', score: 70, weight: 0.25, explanation: { summary: '', metrics: {} } },
      { category: 'compliance', score: 88, weight: 0.15, explanation: { summary: '', metrics: {} } },
      { category: 'overall', score: 80, weight: 1, explanation: { summary: '', metrics: {} } },
    ]);

    const bullets = buildDecisionBullets(winner, runnerUp, mockReport());
    const pros = bullets.filter((b) => b.polarity === 'pro');
    const cons = bullets.filter((b) => b.polarity === 'con');

    expect(pros.some((b) => b.text.includes('Cost improves'))).toBe(true);
    expect(pros.some((b) => b.source === 'score')).toBe(true);
    expect(cons.some((b) => b.text.includes('Energy'))).toBe(true);
    expect(cons.some((b) => b.source === 'risk')).toBe(true);
  });

  it('adds permit blocked con when export is not ready', () => {
    const winner = mockCandidate('winner', 'resale_value', [
      { category: 'overall', score: 88, weight: 1, explanation: { summary: '', metrics: {} } },
    ]);
    const runnerUp = mockCandidate('runner', 'family_focused', [
      { category: 'overall', score: 80, weight: 1, explanation: { summary: '', metrics: {} } },
    ]);

    const bullets = buildDecisionBullets(
      winner,
      runnerUp,
      mockReport({ permitReady: false, riskAreas: [] }),
    );

    expect(bullets.some((b) => b.text.includes('Permit blocked'))).toBe(true);
  });
});

describe('buildDecisionHeadline', () => {
  it('returns moat gain summary', () => {
    expect(buildDecisionHeadline(mockReport())).toContain('Optimization moat active');
  });
});
