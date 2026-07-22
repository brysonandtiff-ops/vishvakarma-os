import { describe, expect, it } from 'vitest';
import type { PipelineStage } from '@/core-contract/pipeline.schema';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';

const GOLDEN_PROMPT = '4-bedroom modern home on 600m² corner block with double garage';

describe('runBuildingDesignerPipeline stage progress', () => {
  it('emits stages in execution order with work aligned to labels', async () => {
    const stages: PipelineStage[] = [];

    await runBuildingDesignerPipeline({
      prompt: GOLDEN_PROMPT,
      onStage: (stage) => stages.push(stage),
    });

    expect(stages).toContain('extracting');
    expect(stages).toContain('constraints');
    expect(stages).toContain('layout');
    expect(stages).toContain('floorplan');
    expect(stages).toContain('concept');
    expect(stages).toContain('schedules');
    expect(stages).toContain('compliance');
    expect(stages[stages.length - 1]).toBe('complete');

    const floorplanIdx = stages.indexOf('floorplan');
    const conceptIdx = stages.indexOf('concept');
    const schedulesIdx = stages.indexOf('schedules');
    const complianceIdx = stages.indexOf('compliance');

    expect(floorplanIdx).toBeLessThan(conceptIdx);
    expect(conceptIdx).toBeLessThan(schedulesIdx);
    expect(schedulesIdx).toBeLessThan(complianceIdx);
    expect(complianceIdx).toBeLessThan(stages.indexOf('complete'));
  });
});
