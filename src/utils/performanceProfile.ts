import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';

export type PerformanceProfile = 'draft' | 'studio' | 'presentation';

export const PERFORMANCE_PROFILE_STORAGE_KEY = 'vishvakarma.os.performance.profile.v1';

export function resolvePerformanceProfile(stored?: string | null): PerformanceProfile {
  if (stored === 'draft' || stored === 'studio' || stored === 'presentation') {
    return stored;
  }
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return 'draft';
  }
  return 'studio';
}

export function readStoredPerformanceProfile(): PerformanceProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(PERFORMANCE_PROFILE_STORAGE_KEY);
  if (stored === 'draft' || stored === 'studio' || stored === 'presentation') {
    return stored;
  }
  return null;
}

export function persistPerformanceProfile(profile: PerformanceProfile) {
  try {
    window.localStorage.setItem(PERFORMANCE_PROFILE_STORAGE_KEY, profile);
  } catch {
    // ignore storage failures
  }
}

export function atmosphereModeForProfile(profile: PerformanceProfile): AtmospherePerformanceMode {
  if (profile === 'draft') return 'standard';
  if (profile === 'presentation') return 'cinematic';
  return 'premium';
}
