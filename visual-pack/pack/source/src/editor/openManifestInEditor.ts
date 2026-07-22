import type { NavigateFunction } from 'react-router-dom';
import type { ProjectManifest } from '@/types';

export type EditorManifestSource = 'sample' | 'ai';

export function openManifestInEditor(
  navigate: NavigateFunction,
  manifest: ProjectManifest,
  options: { source: EditorManifestSource; name?: string },
): void {
  const name = options.name ?? manifest.name;
  navigate('/editor', {
    state: {
      loadManifest: manifest,
      projectName: name,
      manifestSource: options.source,
    },
  });
}
