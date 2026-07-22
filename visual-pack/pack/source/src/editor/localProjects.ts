import type { Project } from '@/types';
import { readLocalDraft, hasMeaningfulDraftContent } from '@/editor/localDraft';
import { createLocalProject } from '@/editor/localProject';

export const LOCAL_PROJECTS_KEY = 'vishvakarma.os.localProjects.v1';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getLocalProjects(): Project[] {
  if (!hasStorage()) return [];

  const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertLocalProject(project: Project) {
  if (!hasStorage()) return false;

  const projects = getLocalProjects();
  const index = projects.findIndex((entry) => entry.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }

  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  return true;
}

export function deleteLocalProject(id: string) {
  if (!hasStorage()) return false;

  const projects = getLocalProjects().filter((entry) => entry.id !== id);
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
