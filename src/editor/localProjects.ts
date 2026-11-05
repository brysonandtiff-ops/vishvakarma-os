import type { Project } from '@/types';
import { readLocalDraft, hasMeaningfulDraftContent } from '@/editor/localDraft';
import { createLocalProject } from '@/editor/localProject';

export const LOCAL_PROJECTS_KEY = 'vishvakarma.os.localProjects.v1';

const LOCAL_PROJECT_RECOVERY_MESSAGE =
  'Local project data could not be read. Existing data was preserved; saving and deleting are paused until recovery.';

const LOCAL_PROJECT_IDENTITY_MESSAGE =
  'Local project identifiers are missing, invalid, or duplicated. Existing data was preserved; saving and deleting are paused until recovery.';

export class LocalProjectRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalProjectRecoveryError';
  }
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function assertValidLocalProjectIdentities(records: unknown[]): asserts records is Project[] {
  const seen = new Set<string>();

  for (const record of records) {
    if (
      record === null ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      !('id' in record) ||
      typeof record.id !== 'string' ||
      record.id.trim().length === 0 ||
      seen.has(record.id)
    ) {
      throw new LocalProjectRecoveryError(LOCAL_PROJECT_IDENTITY_MESSAGE);
    }

    // Preserve case, spaces, Unicode, names, geometry, and unrelated metadata exactly.
    seen.add(record.id);
  }
}

function readLocalProjects(strictForWrite = false): Project[] {
  if (!hasStorage()) return [];

  const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Local project index is not an array');
    }

    if (strictForWrite) {
      assertValidLocalProjectIdentities(parsed);
    }

    return parsed as Project[];
  } catch (error) {
    if (strictForWrite) {
      if (error instanceof LocalProjectRecoveryError) {
        throw error;
      }
      throw new LocalProjectRecoveryError(LOCAL_PROJECT_RECOVERY_MESSAGE);
    }

    // Read-only listing preserves the existing empty-list fallback.
    return [];
  }
}

export function getLocalProjects(): Project[] {
  return readLocalProjects(false);
}

export function upsertLocalProject(project: Project) {
  if (!hasStorage()) return false;

  const projects = readLocalProjects(true);
  const index = projects.findIndex((entry) => entry.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }

  // Reject a new invalid/duplicate identity before any storage mutation.
  assertValidLocalProjectIdentities(projects);
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  return true;
}

export function deleteLocalProject(id: string) {
  if (!hasStorage()) return false;

  const projects = readLocalProjects(true).filter((entry) => entry.id !== id);
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  return true;
}

/** Merge saved local projects with the current browser draft (if any). */
export function getLocalWorkspaceProjects(): Project[] {
  const saved = getLocalProjects();
  const draft = readLocalDraft();

  if (!draft || !hasMeaningfulDraftContent(draft)) {
    return saved;
  }

  const draftId = draft.projectId ?? `local-draft-${draft.savedAt}`;
  const draftProject: Project = {
    id: draftId,
    name: draft.projectName,
    description: draft.manifest.description,
    manifest: draft.manifest,
    created_at: draft.manifest.metadata.created ?? draft.savedAt,
    updated_at: draft.savedAt,
  };

  const withoutDraft = saved.filter((entry) => entry.id !== draftId);
  return [draftProject, ...withoutDraft];
}

export function draftPayloadToProject(payload: {
  projectId: string | null;
  projectName: string;
  manifest: Project['manifest'];
  savedAt: string;
}): Project {
  if (payload.projectId) {
    return {
      id: payload.projectId,
      name: payload.projectName,
      description: payload.manifest.description,
      manifest: payload.manifest,
      created_at: payload.manifest.metadata.created ?? payload.savedAt,
      updated_at: payload.savedAt,
    };
  }

  return createLocalProject(payload.projectName, payload.manifest.description, payload.manifest);
}
