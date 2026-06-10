import { describe, expect, it } from 'vitest';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import {
  buildBatchScoringContext,
  computeOverallScore,
  rankCandidates,
  scoreCandidate,
} from '@/services/optimization/scoring/scoringEngine';
import type { OptimizationCandidate } from '@/domain/optimization/types';

describe('scoringEngine', () => {
  it('scores a candidate with explainable categories', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '3-bedroom modern home on 400m² block',
    });
    const context = buildBatchScoringContext([building], 450_000);
    const scores = scoreCandidate(building, 'family_focused', context);

    expect(scores.length).toBe(9);
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(s.explanation.summary.length).toBeGreaterThan(0);
    }
    const overall = scores.find((s) => s.category === 'overall');
    expect(overall?.score).toBeGreaterThan(0);
  });

  it('ranks candidates by overall score', () => {
    const makeCandidate = (id: string, score: number): OptimizationCandidate => ({
      id,
      label: id,
      objective: 'family_focused',
      building: {} as OptimizationCandidate['building'],
      scores: [],
      overallScore: score,
      rank: 0,
    });

    const ranked = rankCandidates([
      makeCandidate('a', 70),
      makeCandidate('b', 90),
      makeCandidate('c', 80),
    ]);

    expect(ranked[0].id).toBe('b');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
  });

  it('computes weighted overall score', () => {
    const scores = [
      { category: 'compliance' as const, score: 100, weight: 0.5, explanation: { summary: '', metrics: {} } },
      { category: 'energy' as const, score: 60, weight: 0.5, explanation: { summary: '', metrics: {} } },
    ];
    const overall = computeOverallScore(scores, { compliance: 0.5, construction_cost: 0, natural_light: 0, energy: 0.5, circulation: 0, privacy: 0, resale: 0, buildability: 0 });
    expect(overall).toBe(80);
  });
});
