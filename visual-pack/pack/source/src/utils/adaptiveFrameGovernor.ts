import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';

/**
 * Adaptive frame-rate governor.
 *
 * The 3D viewport already maps every GPU cost knob (DPR, shadows, antialias,
 * particle counts, god rays, HDRI environment, contact shadows, post-FX) to a
 * single `AtmospherePerformanceMode` tier. This governor watches the *real*
 * frame time coming out of the render loop and, with hysteresis, caps the
 * effective tier below the user's chosen ceiling when the device cannot hold a
 * smooth rate — then lifts it back toward the ceiling once headroom returns.
 *
 * It is intentionally pure/synchronous (no timers, no DOM) so the decision
 * logic is unit-testable; the React/R3F glue lives in AdaptiveFrameGovernor.tsx.
 */

export const ATMOSPHERE_TIER_ORDER: readonly AtmospherePerformanceMode[] = [
  'standard',
  'premium',
  'cinematic',
] as const;

export function tierRank(mode: AtmospherePerformanceMode): number {
  const rank = ATMOSPHERE_TIER_ORDER.indexOf(mode);
  return rank < 0 ? ATMOSPHERE_TIER_ORDER.length - 1 : rank;
}

export function tierFromRank(rank: number): AtmospherePerformanceMode {
  const clamped = Math.max(0, Math.min(ATMOSPHERE_TIER_ORDER.length - 1, Math.round(rank)));
  return ATMOSPHERE_TIER_ORDER[clamped];
}

/** The lower (cheaper) of two quality tiers. */
export function minTier(
  a: AtmospherePerformanceMode,
  b: AtmospherePerformanceMode,
): AtmospherePerformanceMode {
  return tierRank(a) <= tierRank(b) ? a : b;
}

export interface FrameGovernorConfig {
  /** Frames aggregated into one evaluation window. */
  windowFrames: number;
  /** Below this average FPS a window counts as "struggling". */
  downgradeFps: number;
  /** Above this average FPS a window counts as "comfortable" (spare headroom). */
  upgradeFps: number;
  /** Consecutive struggling windows required before stepping quality down. */
  downgradeStreak: number;
  /** Consecutive comfortable windows required before stepping quality up. */
  upgradeStreak: number;
  /** Windows to wait after any downgrade before an upgrade may be considered. */
  upgradeCooldownWindows: number;
  /**
   * Frame deltas at/above this (ms) are treated as idle/demand-loop gaps rather
   * than dropped frames. Under the viewport's `frameloop="demand"` the loop
   * pauses while idle; the first frame after a pause carries a huge delta that
   * must never be read as a stutter.
   */
  gapFrameMs: number;
}

export const DEFAULT_FRAME_GOVERNOR_CONFIG: FrameGovernorConfig = {
  // Shorter windows let the 3D engine retier in roughly half a second on 60 Hz
  // screens instead of waiting through several seconds of visible stutter.
  windowFrames: 30,
  downgradeFps: 50,
  // 57 FPS lets normal 60 Hz displays recover. The previous 75 FPS threshold
  // could never recover on most laptops/iPads once the viewport had downshifted.
  upgradeFps: 57,
  downgradeStreak: 1,
  upgradeStreak: 8,
  upgradeCooldownWindows: 10,
  gapFrameMs: 160,
};

export interface FrameWindowOutcome {
  /** Average FPS of the window that just completed, or null mid-window. */
  fps: number | null;
  /** Effective adaptive cap after this frame (never above the ceiling). */
  cap: AtmospherePerformanceMode;
  /** True when the cap changed on this frame. */
  changed: boolean;
}

export class FrameGovernor {
  private readonly config: FrameGovernorConfig;
  private ceilingRank: number = tierRank('cinematic');
  private capRank: number = tierRank('cinematic');
  private accumMs = 0;
  private accumFrames = 0;
  private struggleStreak = 0;
  private comfortStreak = 0;
  private cooldown = 0;
  private lastFps = 0;

  constructor(config: Partial<FrameGovernorConfig> = {}) {
    this.config = { ...DEFAULT_FRAME_GOVERNOR_CONFIG, ...config };
  }

  /**
   * Set the user-selected quality tier. The governor never caps above this.
   * `reset` treats the change as fresh user intent: the cap jumps back up to the
   * ceiling and streak/cooldown state is cleared.
   */
  setCeiling(mode: AtmospherePerformanceMode, options: { reset?: boolean } = {}) {
    this.ceilingRank = tierRank(mode);
    if (options.reset) {
      this.capRank = this.ceilingRank;
      this.struggleStreak = 0;
      this.comfortStreak = 0;
      this.cooldown = 0;
      this.accumMs = 0;
      this.accumFrames = 0;
    } else if (this.capRank > this.ceilingRank) {
      this.capRank = this.ceilingRank;
    }
  }

  getCap(): AtmospherePerformanceMode {
    return tierFromRank(Math.min(this.capRank, this.ceilingRank));
  }

  getFps(): number {
    return this.lastFps;
  }

  /** Feed one rendered frame's delta in milliseconds. */
  pushFrame(deltaMs: number): FrameWindowOutcome {
    const cap = this.getCap();

    // Idle / demand-gap frames must not register as catastrophic drops.
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs >= this.config.gapFrameMs) {
      this.accumMs = 0;
      this.accumFrames = 0;
      return { fps: null, cap, changed: false };
    }

    this.accumMs += deltaMs;
    this.accumFrames += 1;
    if (this.accumFrames < this.config.windowFrames) {
      return { fps: null, cap, changed: false };
    }

    const fps = 1000 / (this.accumMs / this.accumFrames);
    this.lastFps = fps;
    this.accumMs = 0;
    this.accumFrames = 0;
    if (this.cooldown > 0) this.cooldown -= 1;

    const beforeRank = Math.min(this.capRank, this.ceilingRank);

    if (fps < this.config.downgradeFps) {
      this.struggleStreak += 1;
      this.comfortStreak = 0;
      if (this.struggleStreak >= this.config.downgradeStreak && this.capRank > 0) {
        this.capRank -= 1;
        this.struggleStreak = 0;
        this.cooldown = this.config.upgradeCooldownWindows;
      }
    } else if (fps > this.config.upgradeFps) {
      this.comfortStreak += 1;
      this.struggleStreak = 0;
      if (
        this.cooldown === 0 &&
        this.comfortStreak >= this.config.upgradeStreak &&
        this.capRank < this.ceilingRank
      ) {
        this.capRank += 1;
        this.comfortStreak = 0;
      }
    } else {
      // Comfortable but not spare: hold steady, let streaks decay.
      this.struggleStreak = 0;
      this.comfortStreak = 0;
    }

    const afterRank = Math.min(this.capRank, this.ceilingRank);
    return { fps, cap: tierFromRank(afterRank), changed: afterRank !== beforeRank };
  }
}
