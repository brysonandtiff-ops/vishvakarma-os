import { describe, expect, it } from 'vitest';
import { LIGHTING_PRESETS, resolveAmbientIntensity, resolveSunColor } from '@/core/lightingPresets';

describe('lightingPresets', () => {
  it('defines five solar presets', () => {
    expect(LIGHTING_PRESETS).toHaveLength(5);
    expect(LIGHTING_PRESETS.map((entry) => entry.id)).toEqual([
      'dawn',
      'noon',
      'golden',
      'dusk',
      'night',
    ]);
  });

  it('warms sun color at golden hour', () => {
    expect(resolveSunColor(17.5, 18)).toBe('#FFB86A');
    expect(resolveSunColor(12, 70)).toBe('#FFF8EE');
  });

  it('boosts ambient at night', () => {
    expect(resolveAmbientIntensity('cinematic', 23, 0)).toBeGreaterThan(
      resolveAmbientIntensity('cinematic', 12, 60),
    );
  });
});
