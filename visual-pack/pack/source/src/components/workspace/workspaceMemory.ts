// Local persistence for workspace layout preferences.
// Stored in localStorage so the operator's shell layout survives reloads.

export interface WorkspacePrefs {
  sidebarCollapsed: boolean;
  density: 'compact' | 'standard' | 'spacious';
  palettePreference: 'icons' | 'text' | 'both';
}

const STORAGE_KEY = 'vishvakarma:workspace:prefs';

export const defaultWorkspacePrefs: WorkspacePrefs = {
  sidebarCollapsed: false,
  density: 'standard',
  palettePreference: 'both',
};

export function loadWorkspacePrefs(): WorkspacePrefs {
  if (typeof window === 'undefined') return { ...defaultWorkspacePrefs };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultWorkspacePrefs };

    const parsed = JSON.parse(raw) as Partial<WorkspacePrefs>;
    return {
      sidebarCollapsed:
        typeof parsed.sidebarCollapsed === 'boolean'
          ? parsed.sidebarCollapsed
          : defaultWorkspacePrefs.sidebarCollapsed,
      density:
        parsed.density && ['compact', 'standard', 'spacious'].includes(parsed.density)
          ? (parsed.density as WorkspacePrefs['density'])
          : defaultWorkspacePrefs.density,
      palettePreference:
        parsed.palettePreference && ['icons', 'text', 'both'].includes(parsed.palettePreference)
          ? (parsed.palettePreference as WorkspacePrefs['palettePreference'])
          : defaultWorkspacePrefs.palettePreference,
    };
  } catch {
    return { ...defaultWorkspacePrefs };
  }
}

export function saveWorkspacePrefs(prefs: WorkspacePrefs): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore write failures (private mode / quota); prefs are non-critical.
  }
}
