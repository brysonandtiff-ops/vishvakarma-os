import type { OptimizationBatch, OptimizationBatchInput } from '@/domain/optimization/types';
import {
  runOptimizationBatch,
  type OptimizationProgressStage,
} from '@/services/optimization/optimizationOrchestrator';

export async function generateOptimizationBatch(
  input: OptimizationBatchInput,
  onProgress?: (candidateIndex: number, stage: OptimizationProgressStage) => void,
): Promise<OptimizationBatch> {
  return runOptimizationBatch(input, onProgress);
}

export { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
