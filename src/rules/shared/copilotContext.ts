import type { CopilotManifestMetadata } from '@/domain/copilot/copilotSession';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import { DEFAULT_COUNCIL_REQUIREMENTS } from '@/domain/copilot/councilRequirements';
import type { ProjectManifest } from '@/types';

export function getCopilotMetadataFromManifest(
  manifest: ProjectManifest,
): CopilotManifestMetadata | null {
  const raw = manifest.metadata?.copilot;
  if (!raw || typeof raw !== 'object') return null;
  return raw as unknown as CopilotManifestMetadata;
}

export function getCouncilFromManifest(manifest: ProjectManifest): CouncilRequirements {
  const copilot = getCopilotMetadataFromManifest(manifest);
  if (copilot?.council) {
    return {
      ...DEFAULT_COUNCIL_REQUIREMENTS,
      ...copilot.council,
      setbacks: {
        ...DEFAULT_COUNCIL_REQUIREMENTS.setbacks,
        ...copilot.council.setbacks,
      },
    };
  }
  return DEFAULT_COUNCIL_REQUIREMENTS;
}

export function getMaxCoverageFromManifest(manifest: ProjectManifest): number {
  return getCouncilFromManifest(manifest).maxCoverageRatio;
}

export function getSetbacksFromManifest(manifest: ProjectManifest): CouncilRequirements['setbacks'] {
  return getCouncilFromManifest(manifest).setbacks;
}
