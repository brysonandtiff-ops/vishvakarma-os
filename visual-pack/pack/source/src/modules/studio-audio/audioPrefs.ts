export interface StudioAudioPrefs {
  sfxEnabled: boolean;
  ambientEnabled: boolean;
  masterVolume: number;
}

const STORAGE_KEY = 'vish-studio-audio-prefs';

const DEFAULT_PREFS: StudioAudioPrefs = {
  sfxEnabled: true,
  ambientEnabled: false,
  masterVolume: 0.65,
};

export function loadStudioAudioPrefs(): StudioAudioPrefs {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<StudioAudioPrefs>;
    return {
      sfxEnabled: parsed.sfxEnabled ?? DEFAULT_PREFS.sfxEnabled,
      ambientEnabled: parsed.ambientEnabled ?? DEFAULT_PREFS.ambientEnabled,
      masterVolume:
        typeof parsed.masterVolume === 'number'
          ? Math.min(1, Math.max(0, parsed.masterVolume))
          : DEFAULT_PREFS.masterVolume,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveStudioAudioPrefs(prefs: StudioAudioPrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const matchMedia = window.matchMedia;
  if (typeof matchMedia !== 'function') return false;
  return matchMedia.call(window, '(prefers-reduced-motion: reduce)').matches;
}
