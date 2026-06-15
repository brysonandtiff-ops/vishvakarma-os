import { describe, expect, it } from 'vitest';
import { DEFAULT_CAST_LENSES, activeLensLabels, mergeCastLenses, toggleCastLens } from '@/cast/CastLensState';

describe('CastLensState', () => {
  it('merges lens patches with layer defaults', () => {
    const next = mergeCastLenses(DEFAULT_CAST_LENSES, {
      thermal: true,
      layers: { vastuOverlay: false },
    });
    expect(next.thermal).toBe(true);
    expect(next.layers.vastuOverlay).toBe(false);
    expect(next.layers.walls).toBe(true);
  });

  it('toggles individual lenses', () => {
    const next = toggleCastLens(DEFAULT_CAST_LENSES, 'vastu');
    expect(next.vastu).toBe(true);
  });

  it('lists active lens labels', () => {
    const labels = activeLensLabels({
      ...DEFAULT_CAST_LENSES,
      thermal: true,
      vayu: true,
    });
    expect(labels).toEqual(['Thermal', 'Vayu CFD']);
  });
});
