import type { ProjectManifest } from '@/types';
import { SYSTEM_MAP_VERSION, SYSTEM_VERSIONS } from '@/core-contract/system.schema';

export function stampSystemMetadata(
  metadata: ProjectManifest['metadata'],
): ProjectManifest['metadata'] {
  return {
    ...metadata,
    systemVersions: { ...SYSTEM_VERSIONS },
    systemMapVersion: SYSTEM_MAP_VERSION,
  };
}
