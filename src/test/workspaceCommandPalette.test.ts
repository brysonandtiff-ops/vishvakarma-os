import { describe, expect, it } from 'vitest';
import routes from '@/routes';
import { getNavigableRoutes } from '@/components/workspace/WorkspaceCommandPalette';
import { defaultWorkspacePrefs, loadWorkspacePrefs, saveWorkspacePrefs } from '@/components/workspace/workspaceMemory';

const lockedPaths = ['/auth', '/', '/spec-center', '/registry', '/change-requests', '/releases', '/world-records', '/audit'];

describe('workspace command palette', () => {
  it('only targets locked, private routes from the manifest', () => {
    const privatePaths = routes
      .filter((route) => route.access === 'private')
      .map((route) => route.path);

    const palettePaths = getNavigableRoutes().map((route) => route.path);

    expect(palettePaths).toEqual(privatePaths);
    for (const path of palettePaths) {
      expect(lockedPaths).toContain(path);
    }
  });

  it('never exposes the public auth route as a navigation target', () => {
    const palettePaths = getNavigableRoutes().map((route) => route.path);
    expect(palettePaths).not.toContain('/auth');
  });
});

describe('workspace memory persistence', () => {
  it('round-trips layout preferences through storage', () => {
    const testPrefs: any = { 
      sidebarCollapsed: true, 
      density: 'compact', 
      palettePreference: 'icons' 
    };
    saveWorkspacePrefs(testPrefs);
    const loaded = loadWorkspacePrefs();
    expect(loaded.sidebarCollapsed).toBe(true);
    expect(loaded.density).toBe('compact');
    expect(loaded.palettePreference).toBe('icons');

    saveWorkspacePrefs({ ...defaultWorkspacePrefs, sidebarCollapsed: false });
    expect(loadWorkspacePrefs().sidebarCollapsed).toBe(false);
  });

  it('falls back to defaults when storage is empty', () => {
    window.localStorage.clear();
    expect(loadWorkspacePrefs()).toEqual(defaultWorkspacePrefs);
  });
});
