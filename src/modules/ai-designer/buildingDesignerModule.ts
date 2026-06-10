import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import type { BuildingDesignerInput, BuildingDesignerResult } from '@/modules/ai-designer/types';

export async function generateFromPrompt(input: BuildingDesignerInput): Promise<BuildingDesignerResult> {
  const building = await runBuildingDesignerPipeline(input);
  return { building, stage: 'complete' };
}

export async function generateFromCopilotSession(
  input: BuildingDesignerInput,
): Promise<BuildingDesignerResult> {
  const building = await runBuildingDesignerPipeline(input);
  return { building, stage: 'complete' };
}

export { parseRequirementsFallback } from '@/ai/building-designer/generators/requirementsExtractor';
