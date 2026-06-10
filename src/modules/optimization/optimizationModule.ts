import type { OptimizationBatch, OptimizationBatchInput } from '@/domain/optimization/types';
import { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
import type { PipelineStage } from '@/services/floorplan-generation/orchestrator';

export async function generateOptimizationBatch(
  input: OptimizationBatchInput,
  onProgress?: (candidateIndex: number, stage: PipelineStage) => void,
): Promise<OptimizationBatch> {
  return runOptimizationBatch(input, onProgress);
}

export { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
