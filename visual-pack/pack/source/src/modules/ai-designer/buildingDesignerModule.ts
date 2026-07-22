// planningPipeline is dynamically imported inside generateFromCopilotSession so it
// stays in its own lazy chunk. The orchestrator also imports it dynamically; having
// both as dynamic resolves the build warning about static+dynamic conflict.
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
  // Dynamic import — keeps planningPipeline in its own chunk, loaded only when needed
  const { runPlanningIntelligencePipeline } = await import('@/planning/planningPipeline');
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
