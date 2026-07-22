import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';

/**
 * Tiny external store that carries live frame-rate telemetry from the in-Canvas
 * adaptive governor out to UI that lives outside the R3F tree (the perf HUD).
 * Kept dependency-free and `useSyncExternalStore`-friendly.
 */
export interface FrameStats {
  /** Last measured average FPS, or 0 before the first sample. */
  fps: number;
  /** Adaptive tier the governor settled on, or null when unthrottled. */
  cap: AtmospherePerformanceMode | null;
  updatedAt: number;
}

const INITIAL: FrameStats = { fps: 0, cap: null, updatedAt: 0 };

let current: FrameStats = INITIAL;
const listeners = new Set<() => void>();

export function reportFrameStats(stats: { fps: number; cap: AtmospherePerformanceMode | null }): void {
  current = { fps: stats.fps, cap: stats.cap, updatedAt: Date.now() };
  for (const listener of listeners) listener();
}

export function getFrameStats(): FrameStats {
  return current;
}

export function subscribeFrameStats(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
