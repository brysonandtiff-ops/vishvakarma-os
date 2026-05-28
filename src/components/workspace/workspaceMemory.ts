// Local persistence for workspace layout preferences.
// Stored in localStorage so the operator's shell layout survives reloads.

export interface WorkspacePrefs {
  sidebarCollapsed: boolean;
}

const STORAGE_KEY = 'vishvakarma:workspace:prefs';

export const defaultWorkspacePrefs: WorkspacePrefs = {
  sidebarCollapsed: false,
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
