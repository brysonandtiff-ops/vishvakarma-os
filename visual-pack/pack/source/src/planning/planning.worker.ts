import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import { generateLayoutCandidates } from '@/planning/candidateGenerator';
import type { LayoutCandidate } from '@/planning/types';

export interface PlanningWorkerRequest {
  type: 'generate';
  constraints: ConstraintResult;
  count: number;
  allowRotation: boolean;
}

export interface PlanningWorkerResponse {
  type: 'result';
  candidates: LayoutCandidate[];
}

export interface PlanningWorkerProgress {
  type: 'progress';
  current: number;
  total: number;
}

self.onmessage = (event: MessageEvent<PlanningWorkerRequest>) => {
  const payload = event.data;
  if (payload.type !== 'generate') return;

  const { constraints, count, allowRotation } = payload;

  self.postMessage({ type: 'progress', current: 0, total: count } satisfies PlanningWorkerProgress);

  const candidates = generateLayoutCandidates(constraints, count, allowRotation);

  self.postMessage({
    type: 'progress',
    current: count,
    total: count,
  } satisfies PlanningWorkerProgress);

  self.postMessage({
    type: 'result',
    candidates,
  } satisfies PlanningWorkerResponse);
};

export {};
