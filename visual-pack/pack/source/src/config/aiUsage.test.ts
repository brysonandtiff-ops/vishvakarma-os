import { describe, expect, it } from 'vitest';
import {
  DAILY_AI_LIMITS,
  MAX_AI_UPLOAD_BASE64_LENGTH,
  dailyAiLimit,
  exceedsUploadCap,
} from './aiUsage';

describe('dailyAiLimit', () => {
  it('returns the configured ceiling for each tier', () => {
    expect(dailyAiLimit('starter')).toBe(DAILY_AI_LIMITS.starter);
    expect(dailyAiLimit('studio')).toBe(DAILY_AI_LIMITS.studio);
    expect(dailyAiLimit('enterprise')).toBe(DAILY_AI_LIMITS.enterprise);
  });

  it('grants higher ceilings to paid tiers', () => {
    expect(dailyAiLimit('studio')).toBeGreaterThan(dailyAiLimit('starter'));
    expect(dailyAiLimit('enterprise')).toBeGreaterThan(dailyAiLimit('studio'));
  });

  it('falls back to the starter ceiling for an unknown tier', () => {
    expect(dailyAiLimit('mystery' as never)).toBe(DAILY_AI_LIMITS.starter);
  });
});

describe('exceedsUploadCap', () => {
  it('returns false when every payload is within the cap', () => {
    expect(exceedsUploadCap([undefined, 'short', 'a'.repeat(1024)])).toBe(false);
  });

  it('returns true when any payload exceeds the cap', () => {
    const tooBig = 'a'.repeat(MAX_AI_UPLOAD_BASE64_LENGTH + 1);
    expect(exceedsUploadCap(['small', tooBig])).toBe(true);
  });

  it('respects a custom max length', () => {
    expect(exceedsUploadCap(['abcd'], 3)).toBe(true);
    expect(exceedsUploadCap(['ab'], 3)).toBe(false);
  });

  it('ignores non-string entries', () => {
    expect(exceedsUploadCap([undefined, undefined])).toBe(false);
  });
});
