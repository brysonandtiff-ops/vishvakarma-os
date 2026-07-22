import type { ProjectManifest } from '@/types';
import { isProjectManifest } from './projectModel';

export const PROJECT_EXPORT_EXTENSION = '.json';

export interface ProjectExportParseResult {
  ok: boolean;
  manifest?: ProjectManifest;
  error?: string;
}

export function buildProjectExportFilename(manifest: Pick<ProjectManifest, 'name'>) {
  const slug = manifest.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'untitled-project'}-floor-plan${PROJECT_EXPORT_EXTENSION}`;
}

export function serializeProjectManifest(manifest: ProjectManifest) {
  return JSON.stringify(manifest, null, 2);
}

export function parseProjectManifestJson(raw: string): ProjectExportParseResult {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isProjectManifest(parsed)) {
      return {
        ok: false,
        error: 'Imported file is not a Vishvakarma.OS project manifest.',
      };
    }

    return {
      ok: true,
      manifest: parsed,
    };
  } catch {
    return {
      ok: false,
      error: 'Imported file is not valid JSON.',
    };
  }
}

export function roundTripProjectManifest(manifest: ProjectManifest) {
  return parseProjectManifestJson(serializeProjectManifest(manifest));
}
