export type AtmospherePerformanceMode = 'standard' | 'premium' | 'cinematic';

export const ATMOSPHERE_STORAGE_KEY = 'vishvakarma.os.3d.atmosphere.v1';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

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

  const isCoarsePointer =
    options.isCoarsePointer ??
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(COARSE_POINTER_QUERY).matches
      : false);

  const cores =
    options.hardwareConcurrency ??
    (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined);

  if (isCoarsePointer && cores !== undefined && cores <= 4) {
    return 'standard';
  }

  return 'premium';
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
