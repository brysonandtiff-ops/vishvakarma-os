import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@/types';
import {
  deleteLocalProject,
  getLocalProjects,
  LOCAL_PROJECTS_KEY,
  LocalProjectRecoveryError,
  upsertLocalProject,
} from '@/editor/localProjects';

function project(id: string, name: string): Project {
  return {
    id,
    name,
    description: `${name} description`,
    manifest: {
      projectName: name,
      description: `${name} description`,
      units: 'metric',
      walls: [],
      openings: [],
      rooms: [],
      furniture: [],
      lighting: {
        sunAzimuth: 180,
        sunElevation: 45,
        timeOfDay: 12,
        intensity: 1,
      },
      snapToGrid: true,
      metadata: {},
    } as Project['manifest'],
    created_at: '2026-10-30T00:00:00.000Z',
    updated_at: '2026-10-30T00:00:00.000Z',
  };
}

describe('local project recovery protection', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the read-only list tolerant of malformed JSON', () => {
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, '[{"id":"broken"');
    expect(getLocalProjects()).toEqual([]);
  });

  it('blocks save when existing storage is malformed and preserves the original bytes', () => {
    const damaged = '[{"id":"keep-this-evidence"';
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, damaged);

    expect(() => upsertLocalProject(project('local-new', 'New design'))).toThrow(
      LocalProjectRecoveryError,
    );
    expect(window.localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(damaged);
  });

  it('blocks delete when existing storage is malformed and preserves the original bytes', () => {
    const damaged = '{"not":"an array"}';
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, damaged);

    expect(() => deleteLocalProject('local-any')).toThrow(LocalProjectRecoveryError);
    expect(window.localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(damaged);
  });

  it('blocks ambiguous duplicate IDs without deleting either design', () => {
    const original = JSON.stringify([
      project('local-duplicate', 'Design A'),
      project('local-duplicate', 'Design B'),
    ]);
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, original);

    expect(() => deleteLocalProject('local-duplicate')).toThrow(LocalProjectRecoveryError);
    expect(window.localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(original);
  });

  it('rejects a new project with a blank identifier before writing', () => {
    const original = JSON.stringify([project('local-safe', 'Existing')]);
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, original);

    expect(() => upsertLocalProject(project('   ', 'Invalid'))).toThrow(
      LocalProjectRecoveryError,
    );
    expect(window.localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(original);
  });

  it('keeps same-name projects independent when their IDs differ', () => {
    const first = project('local-a', 'Shared name');
    const second = project('local-b', 'Shared name');
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify([first, second]));

    expect(deleteLocalProject('local-a')).toBe(true);
    expect(getLocalProjects()).toEqual([second]);
  });
});
