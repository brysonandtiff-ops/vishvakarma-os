import { describe, expect, it } from 'vitest';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import { mergeCopilotRequirements } from '@/services/copilot/ingestion/requirementMerger';
import { parseCouncilText } from '@/services/copilot/ingestion/documentParsers';

describe('Architecture Copilot pipeline', () => {
  it('merges council requirements into building request', async () => {
    const council = parseCouncilText('Front setback: 5m Side setback: 2m Rear setback: 4m Maximum coverage: 35%');
    const merged = await mergeCopilotRequirements('4-bedroom home', {
      mergedPrompt: '4-bedroom home',
      council,
    });

    expect(merged.council.setbacks.front).toBe(5);
    expect(merged.request.bedrooms).toBeGreaterThanOrEqual(3);
  });

  it('produces full copilot deliverables including compliance and materials', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
      ingestion: {
        mergedPrompt: '4-bedroom modern home',
        council: parseCouncilText('Front setback: 6m Side setback: 1.5m Rear setback: 3m Maximum coverage: 40%'),
      },
      sessionId: 'test-session',
    });

    expect(building.conceptDesign.roomProgram.length).toBeGreaterThan(0);
    expect(building.materialList.length).toBeGreaterThan(0);
    expect(building.complianceReport.results.length).toBe(12);
    expect(building.manifest.metadata.copilot).toBeTruthy();
    expect(building.copilot?.sessionId).toBe('test-session');
  });

  it('planning intelligence produces ranked scores and explanation via copilot module', async () => {
    const { generateFromCopilotSession } = await import('@/modules/ai-designer/buildingDesignerModule');
    const { building } = await generateFromCopilotSession({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
      ingestion: {
        mergedPrompt: '4-bedroom modern home',
        council: parseCouncilText('Front setback: 6m Side setback: 1.5m Rear setback: 3m Maximum coverage: 40%'),
      },
      sessionId: 'planning-session',
      candidateCount: 20,
      useWorker: false,
    });

    expect(building.planning?.candidateCount).toBe(20);
    expect(building.planning?.explanation.summary).toContain('Selected');
    expect(building.planning?.rankedScores.length).toBeGreaterThanOrEqual(20);
  });
});
