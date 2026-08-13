import {
  deleteLocalProject,
  getActiveLocalProject,
  LOCAL_ACTIVE_PROJECT_KEY,
  LOCAL_PROJECTS_KEY,
  setActiveLocalProject,
} from '@/editor/localProjects';
import { createLocalProject } from '@/editor/localProject';

function makeProject(name: string) {
  return createLocalProject(name, undefined, {
    version: 1,
    name,
    units: 'metric',
    floors: [],
    walls: [],
    openings: [],
    furniture: [],
    fixtures: [],
    labels: [],
    metadata: {},
  });
}

describe('localProjects', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('restores the active local project from browser storage', () => {
    const project = makeProject('Courtyard House');

    expect(setActiveLocalProject(project)).toBe(true);
    expect(window.localStorage.getItem(LOCAL_ACTIVE_PROJECT_KEY)).toBe(project.id);
    expect(getActiveLocalProject()).toMatchObject({ id: project.id, name: 'Courtyard House' });
  });

  it('clears the active pointer when that local project is deleted', () => {
    const project = makeProject('Garden Studio');
    setActiveLocalProject(project);

    expect(deleteLocalProject(project.id)).toBe(true);
    expect(window.localStorage.getItem(LOCAL_ACTIVE_PROJECT_KEY)).toBeNull();
    expect(window.localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe('[]');
    expect(getActiveLocalProject()).toBeNull();
  });
});
