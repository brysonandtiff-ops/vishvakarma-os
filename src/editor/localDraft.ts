import type { LightingConfig, Opening, ProjectManifest, Wall } from '@/types';
import { createProjectManifest, PROJECT_SPEC_VERSION } from '@/core/projectModel';

export const LOCAL_DRAFT_KEY = 'vishvakarma.os.editor.localDraft.v1';
export const LOCAL_DRAFT_VERSION = 1;

export interface LocalDraftPayload {
  version: number;
  savedAt: string;
  projectId: string | null;
  projectName: string;
  manifest: ProjectManifest;
}

export type DraftSnapshotInput = {
  projectId?: string | null;
  projectName: string;
  description?: string;
  walls: Wall[];
  openings: Opening[];
  lighting: LightingConfig;
  snapEnabled: boolean;
};

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function buildDraftPayloadFromManifest(input: {
  projectId?: string | null;
  projectName: string;
  manifest: ProjectManifest;
}): LocalDraftPayload {
  const now = new Date().toISOString();

  return {
    version: LOCAL_DRAFT_VERSION,
    savedAt: now,
    projectId: input.projectId ?? null,
    projectName: input.projectName,
    manifest: {
      ...input.manifest,
      name: input.projectName,
      metadata: {
        ...input.manifest.metadata,
        modified: now,
      },
    },
  };
}

export function buildDraftPayload(input: DraftSnapshotInput): LocalDraftPayload {
  const now = new Date().toISOString();

  return buildDraftPayloadFromManifest({
    projectId: input.projectId ?? null,
    projectName: input.projectName,
    manifest: createProjectManifest({
      name: input.projectName,
      description: input.description,
      walls: input.walls,
      openings: input.openings,
      lighting: input.lighting,
      snapToGrid: input.snapEnabled,
      createdAt: now,
      modifiedAt: now,
    }),
  });
}

export function hasMeaningfulDraftContent(payload: LocalDraftPayload) {
  return payload.manifest.walls.length > 0 || payload.manifest.openings.length > 0;
}

export function saveLocalDraft(payload: LocalDraftPayload) {
  if (!hasStorage()) return false;

  window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
  return true;
}

/** Debounced callers use this alias; persists synchronously until worker offload ships. */
export function scheduleLocalDraftSave(payload: LocalDraftPayload) {
  return saveLocalDraft(payload);
}

export function readLocalDraft(): LocalDraftPayload | null {
  if (!hasStorage()) return null;

  const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDraftPayload>;
    if (parsed.version !== LOCAL_DRAFT_VERSION) return null;
    if (!parsed.manifest || !Array.isArray(parsed.manifest.walls) || !Array.isArray(parsed.manifest.openings)) {
      return null;
    }

    if (parsed.manifest.version !== PROJECT_SPEC_VERSION) {
      return null;
    }

    return parsed as LocalDraftPayload;
  } catch {
    return null;
  }
}

export function clearLocalDraft() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(LOCAL_DRAFT_KEY);
}
