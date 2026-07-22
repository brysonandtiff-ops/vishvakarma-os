import type { Project, ProjectManifest } from '@/types';

export function isLocalProjectId(id: string) {
  return id.startsWith('local-');
}

export function createLocalProject(
  name: string,
  description: string | undefined,
  manifest: ProjectManifest,
): Project {
  const now = new Date().toISOString();

  return {
    id: `local-${crypto.randomUUID()}`,
    name,
    description,
    manifest,
    created_at: now,
    updated_at: now,
  };
}
