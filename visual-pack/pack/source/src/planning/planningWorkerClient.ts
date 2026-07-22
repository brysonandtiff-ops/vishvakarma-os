import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import { generateLayoutCandidates } from '@/planning/candidateGenerator';
import type { LayoutCandidate, PlanningProgress } from '@/planning/types';

function generateCandidatesSync(
  constraints: ConstraintResult,
  count: number,
  allowRotation: boolean,
  onProgress?: (progress: PlanningProgress) => void,
): LayoutCandidate[] {
  onProgress?.({
    phase: 'generating',
    current: 0,
    total: count,
    message: `Evaluating option 0 of ${count}…`,
  });

  const candidates = generateLayoutCandidates(constraints, count, allowRotation);

  onProgress?.({
    phase: 'generating',
    current: count,
    total: count,
    message: `Evaluating option ${count} of ${count}…`,
  });

  return candidates;
}

export async function generateCandidatesInWorker(
  constraints: ConstraintResult,
  count: number,
  allowRotation: boolean,
  useWorker: boolean,
  onProgress?: (progress: PlanningProgress) => void,
): Promise<LayoutCandidate[]> {
  if (!useWorker || typeof Worker === 'undefined') {
    return generateCandidatesSync(constraints, count, allowRotation, onProgress);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./planning.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as
        | { type: 'progress'; current: number; total: number }
        | { type: 'result'; candidates: LayoutCandidate[] };

      if (data.type === 'progress') {
        onProgress?.({
          phase: 'generating',
          current: data.current,
          total: data.total,
          message: `Evaluating option ${data.current} of ${data.total}…`,
        });
        return;
      }

      worker.terminate();
      resolve(data.candidates);
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    worker.postMessage({
      type: 'generate',
      constraints,
      count,
      allowRotation,
    });
  });
}
