import { DEFAULT_FLOOR_MATERIAL, PROJECT_SPEC_VERSION } from '@/core/projectModel';
import type { LightingConfig, Opening, Wall } from '@/types';
import {
  LOCAL_DRAFT_KEY,
  LOCAL_DRAFT_VERSION,
  buildDraftPayload,
  clearLocalDraft,
  hasMeaningfulDraftContent,
  readLocalDraft,
  saveLocalDraft,
} from './localDraft';

const lighting: LightingConfig = {
  sunAzimuth: 180,
  sunElevation: 45,
  timeOfDay: 12,
  intensity: 1,
};

const wall: Wall = {
  id: 'wall-1',
  start: { x: 0, y: 0 },
  end: { x: 200, y: 0 },
  thickness: 10,
  height: 240,
  material: 'material-paint',
};

const opening: Opening = {
  id: 'door-1',
  type: 'door',
  wallId: 'wall-1',
  position: 0.5,
  width: 90,
  height: 210,
};

describe('localDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('builds draft payloads through the canonical project model contract', () => {
    const draft = buildDraftPayload({
      projectId: 'project-1',
      projectName: 'Draft Proof',
      description: 'Recovered project',
      walls: [wall],
      openings: [opening],
      lighting,
      snapEnabled: false,
    });

    expect(draft.version).toBe(LOCAL_DRAFT_VERSION);
    expect(draft.projectId).toBe('project-1');
    expect(draft.projectName).toBe('Draft Proof');
    expect(draft.manifest.version).toBe(PROJECT_SPEC_VERSION);
    expect(draft.manifest.name).toBe('Draft Proof');
    expect(draft.manifest.description).toBe('Recovered project');
    expect(draft.manifest.walls).toEqual([wall]);
    expect(draft.manifest.openings).toEqual([opening]);
    expect(draft.manifest.floorMaterial).toBe(DEFAULT_FLOOR_MATERIAL);
    expect(draft.manifest.lighting).toEqual(lighting);
    expect(draft.manifest.snapToGrid).toBe(false);
  });

  it('detects meaningful geometry for recovery prompts', () => {
    const emptyDraft = buildDraftPayload({
      projectName: 'Empty',
      walls: [],
      openings: [],
      lighting,
      snapEnabled: true,
    });

    const geometryDraft = buildDraftPayload({
      projectName: 'Geometry',
      walls: [wall],
      openings: [],
      lighting,
      snapEnabled: true,
    });

    expect(hasMeaningfulDraftContent(emptyDraft)).toBe(false);
    expect(hasMeaningfulDraftContent(geometryDraft)).toBe(true);
  });

  it('saves, reads, and clears local drafts safely', () => {
    const draft = buildDraftPayload({
      projectName: 'Local Save Proof',
      walls: [wall],
      openings: [opening],
      lighting,
      snapEnabled: true,
    });

    expect(saveLocalDraft(draft)).toBe(true);
    expect(readLocalDraft()).toMatchObject({
      version: LOCAL_DRAFT_VERSION,
      projectName: 'Local Save Proof',
    });

    clearLocalDraft();
    expect(window.localStorage.getItem(LOCAL_DRAFT_KEY)).toBeNull();
    expect(readLocalDraft()).toBeNull();
  });

  it('rejects stale draft schema versions and invalid project spec versions', () => {
    const draft = buildDraftPayload({
      projectName: 'Invalid Proof',
      walls: [wall],
      openings: [],
      lighting,
      snapEnabled: true,
    });

    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ ...draft, version: LOCAL_DRAFT_VERSION + 1 }));
    expect(readLocalDraft()).toBeNull();

    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
      ...draft,
      version: LOCAL_DRAFT_VERSION,
      manifest: { ...draft.manifest, version: '0.0.0' },
    }));
    expect(readLocalDraft()).toBeNull();
  });
});
