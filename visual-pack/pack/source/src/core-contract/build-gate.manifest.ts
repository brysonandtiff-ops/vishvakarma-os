import type { BuildGateDeclaration } from '@/core-contract/build-gate.schema';

/**
 * Active build gate declaration for core-touching changes.
 * Update when opening PRs that modify pipeline, compliance, or cost models.
 */
export const BUILD_GATE_MANIFEST: BuildGateDeclaration = {
  touchesCore: true,
  modifiesPipeline: true,
  affectsCompliance: false,
  affectsCostModel: false,
  requiresRevalidation: true,
};
