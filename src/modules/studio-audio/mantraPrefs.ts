/**
 * mantraPrefs.ts
 * Persists user mantra preferences to localStorage.
 */

export interface MantraPrefs {
  /** Whether the mantra player is enabled (user has turned it on) */
  enabled: boolean;
  /** The currently selected track ID */
  trackId: string;
  /** Volume 0–1 */
  volume: number;
}

const STORAGE_KEY = 'vish-mantra-prefs';

const DEFAULT_PREFS: MantraPrefs = {
  enabled: false,
  trackId: 'vishvakarma-mantra',
  volume: 0.45,
};

export function loadMantraPrefs(): MantraPrefs {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<MantraPrefs>;
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFS.enabled,
      trackId: typeof parsed.trackId === 'string' ? parsed.trackId : DEFAULT_PREFS.trackId,
      volume:
        typeof parsed.volume === 'number'
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_PREFS.volume,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveMantraPrefs(prefs: MantraPrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}
