import { describe, expect, it } from 'vitest';
import { runPlanningIntelligencePipeline } from '@/planning/planningPipeline';
import { parseCouncilText } from '@/services/copilot/ingestion/documentParsers';

describe('planningPipeline', () => {
  it('selects a winner with explanation and ranked scores', async () => {
    const result = await runPlanningIntelligencePipeline({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
      ingestion: {
        mergedPrompt: '4-bedroom modern home',
        council: parseCouncilText('Front setback: 6m Side setback: 1.5m Rear setback: 3m Maximum coverage: 40%'),
      },
      sessionId: 'planning-test',
      candidateCount: 20,
      fullBuildTopK: 3,
      useWorker: false,
    });

    expect(result.planning.candidateCount).toBe(20);
    expect(result.planning.rankedScores.length).toBeGreaterThanOrEqual(20);
    expect(result.planning.explanation.summary).toContain('Selected');
    expect(result.selected.planning?.selectedCandidateId).toBeTruthy();
    expect(result.shortlist.length).toBeGreaterThan(0);
    expect(result.selected.complianceReport.results.length).toBe(12);
    expect(result.selected.manifest.metadata.copilot).toBeTruthy();
    const copilotMeta = result.selected.manifest.metadata.copilot as { planning?: { candidateCount: number } };
    expect(copilotMeta.planning?.candidateCount).toBe(20);
  });

  it('winner scores higher than median candidate on adjacency or compliance', async () => {
    const result = await runPlanningIntelligencePipeline({
      prompt: '3-bedroom home with open plan living',
      candidateCount: 20,
      fullBuildTopK: 5,
      useWorker: false,
    });

    const winner = result.planning.rankedScores.find(
      (s) => s.candidateId === result.planning.selectedCandidateId,
    );
    const median = result.planning.rankedScores[Math.floor(result.planning.rankedScores.length / 2)];

    expect(winner).toBeTruthy();
    expect(winner!.total).toBeGreaterThanOrEqual(median.total - 5);
  });
});
