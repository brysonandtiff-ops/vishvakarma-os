import { isProjectManifest } from '@/core/projectModel';
import type { ProjectManifest } from '@/types';

export interface LiteEditorHandoff {
  liteEditorManifest: ProjectManifest;
}

export function getLiteEditorManifest(state: unknown): ProjectManifest | null {
  if (!state || typeof state !== 'object' || !('liteEditorManifest' in state)) return null;
  return isProjectManifest(state.liteEditorManifest) ? state.liteEditorManifest : null;
}
