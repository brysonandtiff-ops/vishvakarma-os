import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { buildGeneratedBuildingFromLayout } from '@/services/floorplan-generation/buildFromLayout';
import {
  mergeResolvedRequest,
  resolveBuildingRequest,
  type OrchestratorInput,
} from '@/services/floorplan-generation/orchestrator';
import { validateBuildingRequest } from '@/ai/building-designer/validators/buildingRequestValidator';
import {
  rankPlanScores,
  refineScoreWithBuilding,
  scoreLayoutCandidates,
} from '@/planning/planScoringEngine';
import {
  attachPlanningToBuilding,
  buildPlanExplanation,
  buildPlanningMetadata,
  findCandidateById,
  selectBestCandidate,
} from '@/planning/planSelector';
import { generateCandidatesInWorker } from '@/planning/planningWorkerClient';
import type { PlanningIntelligenceInput, PlanningResult } from '@/planning/types';
import { DEFAULT_PLANNING_CONFIG } from '@/planning/types';

export async function runPlanningIntelligencePipeline(
  input: PlanningIntelligenceInput,
): Promise<PlanningResult> {
  if (input.ingestion) {
    input.onStage?.('ingesting');
  } else {
    input.onStage?.('extracting');
  }

  const { request: resolved, council } = await resolveBuildingRequest(input);
  const request = mergeResolvedRequest(resolved, input);

  const requestErrors = validateBuildingRequest(request);
  if (requestErrors.length) {
    throw new Error(requestErrors.join('; '));
  }

  input.onStage?.('constraints');
  const constraints = applyConstraints(request);

  const candidateCount = input.candidateCount ?? DEFAULT_PLANNING_CONFIG.mvpCandidateCount;
  const shortlistSize = input.shortlistSize ?? DEFAULT_PLANNING_CONFIG.shortlistSize;
  const fullBuildTopK = input.fullBuildTopK ?? DEFAULT_PLANNING_CONFIG.fullBuildTopK;
  const allowRotation = Boolean(request.parcel.cornerLot);

  input.onStage?.('layout');
  const layoutCandidates = await generateCandidatesInWorker(
    constraints,
    candidateCount,
    allowRotation,
    input.useWorker ?? candidateCount >= 50,
    input.onPlanningProgress,
  );

  input.onPlanningProgress?.({
    phase: 'scoring',
    current: layoutCandidates.length,
    total: layoutCandidates.length,
    message: 'Scoring layout candidates…',
  });

  const fastScores = rankPlanScores(scoreLayoutCandidates(layoutCandidates, request, council));
  const eligible = fastScores.filter((s) => s.total !== -Infinity);
  const topForBuild = eligible.slice(0, fullBuildTopK);

  input.onPlanningProgress?.({
    phase: 'shortlisting',
    current: topForBuild.length,
    total: fullBuildTopK,
    message: `Building top ${topForBuild.length} candidates…`,
  });

  const builtById = new Map<string, GeneratedBuilding>();
  const refinedScores: typeof fastScores = [];

  for (let index = 0; index < topForBuild.length; index += 1) {
    const score = topForBuild[index];
    const candidate = findCandidateById(layoutCandidates, score.candidateId);
    if (!candidate) continue;

    input.onStage?.('floorplan');
    const building = buildGeneratedBuildingFromLayout({
      request,
      constraints,
      rooms: candidate.rooms,
      circulation: candidate.circulation,
      prompt: input.prompt,
      council,
      sessionId: input.sessionId,
      uploadedDocuments: input.uploadedDocuments,
      ingestion: input.ingestion
        ? { siteSurvey: input.ingestion.siteSurvey, boundary: input.ingestion.boundary }
        : undefined,
      onStage: input.onStage,
    });

    builtById.set(score.candidateId, building);
    refinedScores.push(refineScoreWithBuilding(score, building));
  }

  const ranked = rankPlanScores([
    ...refinedScores,
    ...fastScores.filter((s) => !refinedScores.some((r) => r.candidateId === s.candidateId)),
  ]);

  input.onPlanningProgress?.({
    phase: 'selecting',
    current: ranked.length,
    total: ranked.length,
    message: 'Selecting best plan…',
  });

  const selectedId = input.selectedCandidateId ?? selectBestCandidate(ranked, layoutCandidates).winner.candidateId;
  const explanation = buildPlanExplanation(ranked, selectedId);
  const planning = buildPlanningMetadata(
    ranked,
    explanation,
    selectedId,
    candidateCount,
    layoutCandidates.length,
    Math.min(shortlistSize, topForBuild.length),
  );

  const selectedCandidate = findCandidateById(layoutCandidates, selectedId);
  if (!selectedCandidate) {
    throw new Error(`Selected candidate ${selectedId} not found`);
  }

  let selected =
    builtById.get(selectedId) ??
    buildGeneratedBuildingFromLayout({
      request,
      constraints,
      rooms: selectedCandidate.rooms,
      circulation: selectedCandidate.circulation,
      prompt: input.prompt,
      council,
      sessionId: input.sessionId,
      uploadedDocuments: input.uploadedDocuments,
      ingestion: input.ingestion
        ? { siteSurvey: input.ingestion.siteSurvey, boundary: input.ingestion.boundary }
        : undefined,
      onStage: input.onStage,
    });

  const shortlistIds = ranked
    .filter((s) => s.total !== -Infinity)
    .slice(0, shortlistSize)
    .map((s) => s.candidateId);

  const shortlist = shortlistIds
    .map((id) => builtById.get(id))
    .filter((b): b is GeneratedBuilding => Boolean(b));

  selected = attachPlanningToBuilding(selected, planning, shortlist);

  input.onStage?.('complete');

  return {
    selected,
    shortlist,
    candidates: ranked,
    explanation,
    planning,
  };
}

export type { OrchestratorInput };
