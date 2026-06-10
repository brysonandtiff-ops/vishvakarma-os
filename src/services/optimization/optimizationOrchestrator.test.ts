import { describe, expect, it } from 'vitest';
import { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
import { parseCouncilText } from '@/services/copilot/ingestion/documentParsers';

describe('optimizationOrchestrator', () => {
  it('generates 5 scored and ranked candidates', async () => {
    const batch = await runOptimizationBatch({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
      targetBudget: 500_000,
      ingestion: {
        mergedPrompt: '4-bedroom modern home',
        council: parseCouncilText('Front setback: 6m Side setback: 1.5m Rear setback: 3m Maximum coverage: 40%'),
      },
      sessionId: 'opt-test',
    });

    expect(batch.candidates).toHaveLength(5);
    expect(batch.winnerId).toBeTruthy();
    expect(batch.runnerUpId).toBeTruthy();
    expect(batch.siteFitness.overall).toBeGreaterThan(0);

    for (const candidate of batch.candidates) {
      expect(candidate.scores.length).toBe(9);
      expect(candidate.overallScore).toBeGreaterThan(0);
      expect(candidate.building.complianceReport.results.length).toBe(12);
      expect(candidate.scores[0].explanation.summary.length).toBeGreaterThan(0);
    }

    const ranks = batch.candidates.map((c) => c.rank).sort();
    expect(ranks).toEqual([1, 2, 3, 4, 5]);
    expect(batch.report.winnerLabel).toBeTruthy();
    expect(batch.report.tradeoffs.length).toBe(6);
    expect(batch.report.moatGain.score).toBeGreaterThan(0);
    expect(batch.report.moatGain.compositeScore).toBeGreaterThan(0);
    expect(batch.report.moatGain.valueImpactLabel).toBeTruthy();
    const winner = batch.candidates.find((c) => c.id === batch.winnerId);
    expect(winner?.building.costSummary.intelligence).toBeDefined();
    expect(winner?.building.councilAssessment).toBeDefined();
    expect(batch.report.approvalConfidence).toBeGreaterThan(0);
    for (const candidate of batch.candidates) {
      expect(candidate.building.councilAssessment?.approvalScore).toBeGreaterThan(0);
    }
    expect(winner?.building.costSummary.intelligence?.scenarios.bestCase).toBeLessThan(
      winner?.building.costSummary.intelligence?.scenarios.expected ?? 0,
    );
  }, 60_000);
});
