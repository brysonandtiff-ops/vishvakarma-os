import type { NavigateFunction } from 'react-router-dom';
import type { ProjectManifest } from '@/types';

export type EditorManifestSource = 'sample' | 'ai';
export type EditorManifestView = 'orbit' | 'walk';

export function openManifestInEditor(
  navigate: NavigateFunction,
  manifest: ProjectManifest,
  options: { source: EditorManifestSource; name?: string; view?: EditorManifestView },
): void {
  const name = options.name ?? manifest.name;
  navigate(options.view ? `/editor?view=${options.view}` : '/editor', {
    state: {
      loadManifest: manifest,
      projectName: name,
      manifestSource: options.source,
    },
  });
}
