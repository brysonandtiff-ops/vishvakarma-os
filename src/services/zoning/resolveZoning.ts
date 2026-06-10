import { getSetbacksFromManifest, getMaxCoverageFromManifest } from '@/rules/shared/copilotContext';
import { DEFAULT_ZONING } from '@/services/zoning/zoningRules';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { ProjectManifest } from '@/types';

export function resolveZoningFromManifest(manifest?: ProjectManifest): {
  setbacks: CouncilRequirements['setbacks'];
  maxCoverageRatio: number;
} {
  if (!manifest) {
    return DEFAULT_ZONING;
  }
  return {
    setbacks: getSetbacksFromManifest(manifest),
    maxCoverageRatio: getMaxCoverageFromManifest(manifest),
  };
}

export function resolveZoningFromCouncil(council?: CouncilRequirements): {
  setbacks: CouncilRequirements['setbacks'];
  maxCoverageRatio: number;
} {
  if (!council) return DEFAULT_ZONING;
  return {
    setbacks: council.setbacks,
    maxCoverageRatio: council.maxCoverageRatio,
  };
}
