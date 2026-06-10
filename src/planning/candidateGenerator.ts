import { solveLayout } from '@/ai/building-designer/generators/layoutSolver';
import type { ConstraintResult } from '@/ai/building-designer/generators/constraintEngine';
import type { LayoutCandidate, LayoutSolverOptions, PackingStrategy } from '@/planning/types';

const PACKING_STRATEGIES: PackingStrategy[] = ['row', 'column', 'clusterPublic', 'clusterPrivate'];

export function buildLayoutOptionVariants(count: number, allowRotation = true): LayoutSolverOptions[] {
  const options: LayoutSolverOptions[] = [];
  let index = 0;

  while (options.length < count) {
    const seed = index;
    const packingStrategy = PACKING_STRATEGIES[index % PACKING_STRATEGIES.length];
    const originOffsetX = ((index % 5) - 2) * 12;
    const originOffsetY = ((Math.floor(index / 5) % 5) - 2) * 10;
    const rotationDeg = allowRotation && index % 4 === 3 ? 90 : 0;
    const attemptBudget = 6 + (index % 7);

    options.push({
      seed,
      packingStrategy,
      originOffsetX,
      originOffsetY,
      rotationDeg,
      attemptBudget,
    });
    index += 1;
  }

  return options;
}

export function generateLayoutCandidates(
  constraints: ConstraintResult,
  count: number,
  allowRotation = true,
): LayoutCandidate[] {
  const variants = buildLayoutOptionVariants(count, allowRotation);

  return variants.map((layoutOptions, index) => {
    const { rooms, circulation } = solveLayout(constraints, undefined, layoutOptions);
    return {
      id: `plan-${index + 1}`,
      layoutOptions,
      rooms,
      circulation,
      constraints,
    };
  });
}

export function countDistinctLayouts(candidates: LayoutCandidate[]): number {
  const signatures = new Set(
    candidates.map((c) =>
      c.rooms
        .map((r) => `${r.type}:${r.x},${r.y},${r.width},${r.depth}`)
        .sort()
        .join('|'),
    ),
  );
  return signatures.size;
}
