import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FRAME_GOVERNOR_CONFIG,
  FrameGovernor,
  minTier,
  tierFromRank,
  tierRank,
} from '@/utils/adaptiveFrameGovernor';

/** Feed `windows * framesPerWindow` frames of a fixed delta; return last outcome. */
function feed(governor: FrameGovernor, ms: number, frames: number) {
  let last = governor.pushFrame(ms);
  for (let i = 1; i < frames; i += 1) last = governor.pushFrame(ms);
  return last;
}

describe('adaptiveFrameGovernor — tier helpers', () => {
  it('ranks tiers cheapest → richest', () => {
    expect(tierRank('standard')).toBe(0);
    expect(tierRank('premium')).toBe(1);
    expect(tierRank('cinematic')).toBe(2);
    expect(tierFromRank(2)).toBe('cinematic');
    expect(tierFromRank(99)).toBe('cinematic');
    expect(tierFromRank(-5)).toBe('standard');
  });

  it('minTier picks the cheaper of two tiers', () => {
    expect(minTier('cinematic', 'premium')).toBe('premium');
    expect(minTier('standard', 'cinematic')).toBe('standard');
    expect(minTier('premium', 'premium')).toBe('premium');
  });
});

describe('FrameGovernor — adaptive capping', () => {
  const fast = {
    windowFrames: 2,
    downgradeStreak: 2,
    upgradeStreak: 2,
    upgradeCooldownWindows: 1,
  };

  it('downgrades one tier after a sustained low-FPS streak', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('cinematic', { reset: true });
    expect(g.getCap()).toBe('cinematic');
    // 40ms/frame ≈ 25fps, well under the 48fps floor. Two struggling windows.
    const out = feed(g, 40, 2 * fast.windowFrames);
    expect(g.getCap()).toBe('premium');
    expect(out.fps).not.toBeNull();
    expect(out.changed).toBe(true);
  });

  it('steps all the way down to standard under persistent load', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('cinematic', { reset: true });
    feed(g, 50, 8 * fast.windowFrames); // 20fps for many windows
    expect(g.getCap()).toBe('standard');
  });

  it('never caps above the user-selected ceiling', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('premium', { reset: true });
    expect(g.getCap()).toBe('premium');
    // Tons of headroom (120fps) must not promote past the chosen ceiling.
    feed(g, 8, 20 * fast.windowFrames);
    expect(g.getCap()).toBe('premium');
  });

  it('recovers toward the ceiling once headroom returns', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('cinematic', { reset: true });
    feed(g, 50, 8 * fast.windowFrames); // crater to standard
    expect(g.getCap()).toBe('standard');
    // 8ms/frame ≈ 125fps, above the 75fps upgrade band; climb back up.
    feed(g, 8, 12 * fast.windowFrames);
    expect(g.getCap()).toBe('cinematic');
  });

  it('treats idle / demand-gap frames as non-events (no spurious downgrade)', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('cinematic', { reset: true });
    // Long pauses between single rendered frames simulate the demand loop idling.
    for (let i = 0; i < 10; i += 1) {
      g.pushFrame(5000); // 5s gap — discarded
      g.pushFrame(16);    // one healthy frame
    }
    expect(g.getCap()).toBe('cinematic');
  });

  it('holds steady at a comfortable-but-not-spare frame rate', () => {
    const g = new FrameGovernor(fast);
    g.setCeiling('cinematic', { reset: true });
    // ~60fps sits between downgrade (48) and upgrade (75) thresholds → no churn.
    feed(g, 1000 / 60, 20 * fast.windowFrames);
    expect(g.getCap()).toBe('cinematic');
  });

  it('exposes sane defaults', () => {
    expect(DEFAULT_FRAME_GOVERNOR_CONFIG.downgradeFps).toBeLessThan(
      DEFAULT_FRAME_GOVERNOR_CONFIG.upgradeFps,
    );
    expect(DEFAULT_FRAME_GOVERNOR_CONFIG.windowFrames).toBeGreaterThan(0);
  });
});
