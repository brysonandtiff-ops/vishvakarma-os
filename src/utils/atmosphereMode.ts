import {
  atmosphereModeForProfile,
  readStoredPerformanceProfile,
  resolvePerformanceProfile,
} from '@/utils/performanceProfile';

export type AtmospherePerformanceMode = 'standard' | 'premium' | 'cinematic';

export const ATMOSPHERE_STORAGE_KEY = 'vishvakarma.os.3d.atmosphere.v1';

export function resolveDefaultAtmosphereMode(
  options: {
    prefersReducedMotion?: boolean;
    isCoarsePointer?: boolean;
    hardwareConcurrency?: number;
    storedMode?: string | null;
  } = {},
): AtmospherePerformanceMode {
  const prefersReducedMotion =
    options.prefersReducedMotion ??
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false);

  if (prefersReducedMotion) {
    return 'standard';
  }

  const stored = options.storedMode;
  if (stored === 'standard' || stored === 'premium' || stored === 'cinematic') {
    return stored;
  }

  const profile = readStoredPerformanceProfile() ?? resolvePerformanceProfile();
  return atmosphereModeForProfile(profile);
}

export function readStoredAtmosphereMode(): AtmospherePerformanceMode | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(ATMOSPHERE_STORAGE_KEY);
  if (stored === 'standard' || stored === 'premium' || stored === 'cinematic') {
    return stored;
  }
  return null;
}

export function persistAtmosphereMode(mode: AtmospherePerformanceMode) {
  try {
    window.localStorage.setItem(ATMOSPHERE_STORAGE_KEY, mode);
  } catch {
    // ignore storage failures
  }
}
