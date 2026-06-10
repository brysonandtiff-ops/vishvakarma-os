import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type {
  OptimizationBatch,
  OptimizationBatchInput,
  OptimizationCandidate,
  OptimizationStrategy,
} from '@/domain/optimization/types';
import { applyConstraints } from '@/ai/building-designer/generators/constraintEngine';
import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import { validateBuildingRequest } from '@/ai/building-designer/validators/buildingRequestValidator';
import { buildGeneratedBuildingFromLayout } from '@/services/floorplan-generation/buildFromLayout';
import {
  resolveBuildingRequest,
  mergeResolvedRequest,
  type PipelineStage,
} from '@/services/floorplan-generation/orchestrator';
import { optimizeForBudget } from '@/services/optimization/budgetOptimizer';
import {
  buildBatchScoringContext,
  rankCandidates,
  scoreCandidate,
} from '@/services/optimization/scoring/scoringEngine';
import { getAllStrategies } from '@/services/optimization/strategyProfiles';
import { computeSiteFitness } from '@/services/optimization/siteFitness';
import { buildOptimizationReport } from '@/services/optimization/tradeoffAnalyzer';
import { assertAllowedFlow } from '@/core-contract/systemFlow';

export type OptimizationProgressStage = PipelineStage | 'scoring';

export async function runOptimizationBatch(
  input: OptimizationBatchInput,
  onProgress?: (candidateIndex: number, stage: OptimizationProgressStage) => void,
): Promise<OptimizationBatch> {
  onProgress?.(0, 'extracting');
  const { request: resolved, council } = await resolveBuildingRequest({
    prompt: input.prompt,
    parcelOverride: input.parcelOverride,
    ingestion: input.ingestion,
    sessionId: input.sessionId,
    uploadedDocuments: input.uploadedDocuments as Parameters<
      typeof resolveBuildingRequest
    >[0]['uploadedDocuments'],
  });

  const baseRequest = mergeResolvedRequest(resolved, {
    requestOverride: input.requestOverride,
    parcelOverride: input.parcelOverride,
  });

  const requestErrors = validateBuildingRequest(baseRequest);
  if (requestErrors.length) {
    throw new Error(requestErrors.join('; '));
  }

  if (input.ingestion) {
    assertAllowedFlow('ARCHITECTURE_COPILOT', 'OPTIMIZATION_ENGINE');
  }

  const siteFitness = computeSiteFitness(baseRequest, council);
  const batchId = input.sessionId ?? crypto.randomUUID();
  const strategies = getAllStrategies();
  const rawBuildings: Array<{ strategy: OptimizationStrategy; building: GeneratedBuilding }> = [];

  for (let i = 0; i < strategies.length; i += 1) {
    const strategy = strategies[i];
    onProgress?.(i, 'constraints');

    let request = { ...baseRequest };
    if (input.lifestyleGoals?.length) {
      request = { ...request, extras: [...(request.extras ?? []), ...input.lifestyleGoals] };
    }

    onProgress?.(i, 'layout');
    const constraints = applyConstraints(request, strategy);
    const { rooms, circulation } = solveLayout(constraints, strategy);

    const optimizationMeta = {
      batchId,
      candidateId: strategy.id,
      objective: strategy.objective,
      overallScore: 0,
      rank: 0,
      generatedAt: new Date().toISOString(),
    };

    let building = buildGeneratedBuildingFromLayout({
      request,
      constraints,
      rooms,
      circulation,
      prompt: input.prompt,
      council,
      sessionId: input.sessionId,
      uploadedDocuments: input.uploadedDocuments as Parameters<
        typeof buildGeneratedBuildingFromLayout
      >[0]['uploadedDocuments'],
      ingestion: input.ingestion
        ? { siteSurvey: input.ingestion.siteSurvey, boundary: input.ingestion.boundary }
        : undefined,
      optimization: optimizationMeta,
      targetBudget: input.targetBudget,
      siteFitnessSetbackUtilization: siteFitness.setbackUtilization,
      onStage: (stage) => onProgress?.(i, stage),
    });

    if (input.targetBudget) {
      onProgress?.(i, 'schedules');
      const optimized = optimizeForBudget({
        request,
        strategy,
        targetBudget: input.targetBudget,
        prompt: input.prompt,
        council,
        sessionId: input.sessionId,
        optimization: optimizationMeta,
        initialBuilding: building,
      });
      building = optimized.building;
    }

    rawBuildings.push({ strategy, building });
  }

  onProgress?.(strategies.length, 'scoring');

  const scoringContext = buildBatchScoringContext(
    rawBuildings.map((r) => r.building),
    input.targetBudget,
  );

  let candidates: OptimizationCandidate[] = rawBuildings.map(({ strategy, building }) => {
    const scores = scoreCandidate(building, strategy.objective, scoringContext);
    const overallScore = scores.find((s) => s.category === 'overall')?.score ?? 0;
    return {
      id: strategy.id,
      label: strategy.label,
      objective: strategy.objective,
      building,
      scores,
      overallScore,
      rank: 0,
    };
  });

  candidates = rankCandidates(candidates);
  const winner = candidates[0];
  const runnerUp = candidates[1] ?? candidates[0];
  const report = buildOptimizationReport(winner, runnerUp, candidates);

  onProgress?.(strategies.length, 'complete');

  return {
    id: batchId,
    input,
    resolvedRequest: baseRequest,
    siteFitness,
    candidates,
    winnerId: winner.id,
    runnerUpId: runnerUp.id,
    report,
    createdAt: new Date().toISOString(),
  };
}
