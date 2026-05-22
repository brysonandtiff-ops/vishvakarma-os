import type { LightingConfig, Opening, ProjectManifest, Wall } from '@/types';

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

export function buildDraftPayload(input: DraftSnapshotInput): LocalDraftPayload {
  const now = new Date().toISOString();

  return {
    version: LOCAL_DRAFT_VERSION,
    savedAt: now,
    projectId: input.projectId ?? null,
    projectName: input.projectName,
    manifest: {
      version: '1.0.0',
      name: input.projectName,
      description: input.description,
      walls: input.walls,
      openings: input.openings,
      materials: [],
      floorMaterial: 'material-concrete',
      lighting: input.lighting,
      gridSize: 20,
      snapToGrid: input.snapEnabled,
      metadata: {
        created: now,
        modified: now,
      },
    },
  };
}

export function hasMeaningfulDraftContent(payload: LocalDraftPayload) {
  return payload.manifest.walls.length > 0 || payload.manifest.openings.length > 0;
}

export function saveLocalDraft(payload: LocalDraftPayload) {
  if (!hasStorage()) return false;

  window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
  return true;
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

    return parsed as LocalDraftPayload;
  } catch {
    return null;
  }
}

export function clearLocalDraft() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(LOCAL_DRAFT_KEY);
}
