import { describe, expect, it } from 'vitest';
import { analyzeTradeoffs, identifyRiskAreas } from '@/services/optimization/tradeoffAnalyzer';
import type { OptimizationCandidate } from '@/domain/optimization/types';

function mockCandidate(id: string, scores: Array<{ category: OptimizationCandidate['scores'][0]['category']; score: number }>, blocked = false): OptimizationCandidate {
  return {
    id,
    label: id,
    objective: 'family_focused',
    building: {
      complianceReport: { blocked, overall: blocked ? 'fail' : 'pass', results: [], categories: [], auditedAt: '', projectName: 'test', projectId: 'test' },
      costSummary: { total: 400_000, items: [] },
    } as OptimizationCandidate['building'],
    scores: scores.map((s) => ({
      category: s.category,
      score: s.score,
      weight: 0.1,
      explanation: { summary: 'test', metrics: {} },
    })),
    overallScore: 80,
    rank: 1,
  };
}

describe('tradeoffAnalyzer', () => {
  it('classifies tradeoffs as improves, worsens, or unchanged', () => {
    const winner = mockCandidate('w', [
      { category: 'energy', score: 90 },
      { category: 'construction_cost', score: 60 },
      { category: 'privacy', score: 75 },
    ]);
    const runner = mockCandidate('r', [
      { category: 'energy', score: 70 },
      { category: 'construction_cost', score: 80 },
      { category: 'privacy', score: 74 },
    ]);

    const tradeoffs = analyzeTradeoffs(winner, runner);
    const energy = tradeoffs.find((t) => t.dimension === 'Energy performance');
    const cost = tradeoffs.find((t) => t.dimension === 'Construction cost');
    const privacy = tradeoffs.find((t) => t.dimension === 'Privacy');

    expect(energy?.direction).toBe('improves');
    expect(cost?.direction).toBe('worsens');
    expect(privacy?.direction).toBe('unchanged');
  });

  it('identifies compliance block as risk', () => {
    const candidate = mockCandidate('x', [{ category: 'compliance', score: 0 }], true);
    const risks = identifyRiskAreas(candidate);
    expect(risks.some((r) => r.includes('Compliance'))).toBe(true);
  });
});
