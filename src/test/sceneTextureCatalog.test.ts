import { describe, expect, it } from 'vitest';
import { MATERIAL_PRESETS } from '@/components/editor/MaterialPicker';
import {
  getLandscapePattern,
  getPatternForMaterialType,
  getPatternForSurfaceRole,
  getPresetPatternForMaterial,
} from '@/core/sceneTextureCatalog';
import { LANDSCAPE_TYPES } from '@/core/sceneVisualCatalog';

describe('sceneTextureCatalog', () => {
  it('maps material preset types to patterns', () => {
    for (const preset of MATERIAL_PRESETS) {
      const pattern = getPatternForMaterialType(preset.type);
      expect(pattern.length).toBeGreaterThan(0);
      expect(getPresetPatternForMaterial(preset.id)).toBe(pattern);
    }
  });

  it('maps furniture surface roles', () => {
    expect(getPatternForSurfaceRole('wood')).toBe('wood');
    expect(getPatternForSurfaceRole('fabric')).toBe('fabric');
  });

  it('maps landscape types including water', () => {
    for (const type of LANDSCAPE_TYPES) {
      expect(getLandscapePattern(type, 'body').length).toBeGreaterThan(0);
    }
    expect(getLandscapePattern('water', 'body')).toBe('waterNormal');
    expect(getLandscapePattern('tree', 'trunk')).toBe('bark');
  });
});
