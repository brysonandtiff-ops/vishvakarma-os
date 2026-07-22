import type { BuildGateDeclaration } from '@/core-contract/build-gate.schema';

/**
 * Copy into PR description or PR/build-gate.manifest.ts when opening a core-touching PR.
 */
export const BUILD_GATE_EXAMPLE: BuildGateDeclaration = {
  touchesCore: false,
  modifiesPipeline: false,
  affectsCompliance: false,
  affectsCostModel: false,
  requiresRevalidation: false,
};

export const BUILD_GATE_COST_EXAMPLE: BuildGateDeclaration = {
  touchesCore: false,
  modifiesPipeline: false,
  affectsCompliance: false,
  affectsCostModel: true,
  requiresRevalidation: true,
  valuationImpact: {
    from: '$5M–15M',
    to: '$10M–25M',
    reason: 'Priced BOM + regional index improves cost defensibility in moat scoring.',
  },
};
