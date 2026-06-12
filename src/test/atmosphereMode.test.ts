import { describe, expect, it } from 'vitest';
import { resolveDefaultAtmosphereMode } from '@/utils/atmosphereMode';

describe('resolveDefaultAtmosphereMode', () => {
  it('returns stored preference when valid', () => {
    expect(
      resolveDefaultAtmosphereMode({ storedMode: 'cinematic', prefersReducedMotion: false }),
    ).toBe('cinematic');
  });

  it('uses standard mode when reduced motion is preferred', () => {
    expect(resolveDefaultAtmosphereMode({ prefersReducedMotion: true, storedMode: 'cinematic' })).toBe('standard');
  });

  it('defaults to premium on Retina iPad-like coarse pointer with enough cores', () => {
    expect(
      resolveDefaultAtmosphereMode({
        prefersReducedMotion: false,
        isCoarsePointer: true,
        hardwareConcurrency: 8,
        storedMode: null,
      }),
    ).toBe('premium');
  });

  it('downgrades to standard on low-core coarse devices', () => {
    expect(
      resolveDefaultAtmosphereMode({
        prefersReducedMotion: false,
        isCoarsePointer: true,
        hardwareConcurrency: 4,
        storedMode: null,
      }),
    ).toBe('standard');
  });
});
