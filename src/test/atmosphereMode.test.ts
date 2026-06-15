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

  it('falls back to performance profile mapping when no stored atmosphere', () => {
    expect(resolveDefaultAtmosphereMode({ storedMode: null })).toBe('premium');
  });
});
