import { runPlanningIntelligencePipeline } from '@/planning/planningPipeline';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import type { BuildingDesignerInput, BuildingDesignerResult } from '@/modules/ai-designer/types';
import type { PlanningMetadata } from '@/planning/types';

export async function generateFromPrompt(input: BuildingDesignerInput): Promise<BuildingDesignerResult> {
  const building = await runBuildingDesignerPipeline(input);
  return { building, stage: 'complete' };
}

export async function generateFromCopilotSession(
  input: BuildingDesignerInput,
): Promise<BuildingDesignerResult> {
  const result = await runPlanningIntelligencePipeline({
    ...input,
    candidateCount: input.candidateCount ?? 20,
    fullBuildTopK: input.fullBuildTopK ?? 3,
    useWorker: input.useWorker ?? (input.candidateCount ?? 20) >= 50,
    onPlanningProgress: input.onPlanningProgress,
    selectedCandidateId: input.selectedCandidateId,
  });

  return {
    building: result.selected,
    stage: 'complete',
    planning: result.planning,
    shortlist: result.shortlist,
    rankedScores: result.candidates,
    explanation: result.explanation,
  };
}

export { parseRequirementsFallback } from '@/ai/building-designer/generators/requirementsExtractor';
export type { PlanningMetadata };
