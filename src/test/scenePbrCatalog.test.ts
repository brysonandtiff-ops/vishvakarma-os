import { describe, expect, it } from 'vitest';
import {
  getPbrBundleForMaterialType,
  getPbrBundleForPreset,
  getPbrBundleForSurfaceRole,
  pbrTextureUrl,
  PBR_BUNDLES,
} from '@/core/scenePbrCatalog';

describe('scenePbrCatalog', () => {
  it('maps material types to bundles', () => {
    expect(getPbrBundleForMaterialType('wood').folder).toBe('wood');
    expect(getPbrBundleForMaterialType('stone').folder).toBe('marble');
    expect(getPbrBundleForMaterialType('tile').folder).toBe('tile');
  });

  it('maps preset ids to bundles', () => {
    expect(getPbrBundleForPreset('material-marble').folder).toBe('marble');
    expect(getPbrBundleForPreset('material-metal').folder).toBe('metal');
  });

  it('builds public texture urls', () => {
    expect(pbrTextureUrl('concrete', 'color')).toBe('/textures/concrete/color.webp');
    expect(pbrTextureUrl('concrete', 'normal')).toBe('/textures/concrete/normal.webp');
  });

  it('covers every bundle with fallback patterns', () => {
    for (const bundle of Object.values(PBR_BUNDLES)) {
      expect(bundle.fallbackPattern).toBeTruthy();
      expect(bundle.repeat.length).toBe(2);
    }
  });

  it('maps surface roles for landscape materials', () => {
    expect(getPbrBundleForSurfaceRole('bark').folder).toBe('bark');
    expect(getPbrBundleForSurfaceRole('leaf').fallbackPattern).toBe('leaf');
  });
});
