import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildDraftPayload,
  clearLocalDraft,
  hasMeaningfulDraftContent,
  LOCAL_DRAFT_KEY,
  readLocalDraft,
  saveLocalDraft,
} from '@/editor/localDraft';
import type { LightingConfig, Opening, Wall } from '@/types';

const lighting: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

const walls: Wall[] = [
  {
    id: 'wall-1',
    start: { x: 100, y: 100 },
    end: { x: 300, y: 100 },
    thickness: 10,
    height: 240,
    material: 'material-paint',
  },
];

const openings: Opening[] = [
  {
    id: 'door-1',
    type: 'door',
    wallId: 'wall-1',
    position: 0.5,
    width: 90,
    height: 210,
  },
];

describe('local draft recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('builds a versioned local draft payload from editor state', () => {
    const draft = buildDraftPayload({
      projectId: 'project-1',
      projectName: 'Recovery Test Plan',
      description: 'A local recovery proof',
      walls,
      openings,
      lighting,
      snapEnabled: true,
    });

    expect(draft.version).toBe(1);
    expect(draft.projectId).toBe('project-1');
    expect(draft.projectName).toBe('Recovery Test Plan');
    expect(draft.manifest.walls).toHaveLength(1);
    expect(draft.manifest.openings).toHaveLength(1);
    expect(draft.manifest.snapToGrid).toBe(true);
    expect(hasMeaningfulDraftContent(draft)).toBe(true);
  });

  it('persists and reads a draft after a reload-style readback', () => {
    const draft = buildDraftPayload({
      projectName: 'Reload Recovery Plan',
      walls,
      openings,
      lighting,
      snapEnabled: false,
    });

    expect(saveLocalDraft(draft)).toBe(true);

    const recovered = readLocalDraft();
    expect(recovered).not.toBeNull();
    expect(recovered?.projectName).toBe('Reload Recovery Plan');
    expect(recovered?.manifest.walls[0]?.id).toBe('wall-1');
    expect(recovered?.manifest.openings[0]?.id).toBe('door-1');
    expect(recovered?.manifest.snapToGrid).toBe(false);
  });

  it('ignores corrupt local draft payloads instead of crashing recovery', () => {
    window.localStorage.setItem(LOCAL_DRAFT_KEY, 'invalid-json');
    expect(readLocalDraft()).toBeNull();
  });

  it('clears local draft storage after discard or successful cloud save', () => {
    const draft = buildDraftPayload({
      projectName: 'Discardable Draft',
      walls,
      openings: [],
      lighting,
      snapEnabled: true,
    });

    saveLocalDraft(draft);
    expect(readLocalDraft()).not.toBeNull();

    clearLocalDraft();
    expect(readLocalDraft()).toBeNull();
  });
});
