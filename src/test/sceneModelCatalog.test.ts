import { describe, expect, it } from 'vitest';
import {
  computeFootprintScale,
  FURNITURE_MODEL_PATHS,
  getAllGltfLandscapeTypes,
  getAllSceneModelUrls,
  getExpectedModelFiles,
  getModelScaleTuning,
  LANDSCAPE_MODEL_PATHS,
  PARAMETRIC_ONLY_LANDSCAPE,
  resolveModelUrl,
} from '@/core/sceneModelCatalog';
import { FURNITURE_PRESETS } from '@/core/sceneVisualCatalog';

describe('sceneModelCatalog', () => {
  it('maps every furniture preset to a model path', () => {
    for (const preset of FURNITURE_PRESETS) {
      expect(FURNITURE_MODEL_PATHS[preset.type]).toBe(`/models/furniture/${preset.type}.glb`);
    }
  });

  it('maps GLTF landscape types to model paths', () => {
    for (const type of getAllGltfLandscapeTypes()) {
      expect(LANDSCAPE_MODEL_PATHS[type]).toBe(`/models/landscape/${type}.glb`);
    }
  });

  it('excludes water and path from GLTF resolution', () => {
    for (const type of PARAMETRIC_ONLY_LANDSCAPE) {
      expect(resolveModelUrl('landscape', type)).toBeUndefined();
    }
  });

  it('prefers manifest modelUrl override', () => {
    expect(resolveModelUrl('furniture', 'chair', '/custom/chair.glb')).toBe('/custom/chair.glb');
    expect(resolveModelUrl('landscape', 'tree', '/custom/tree.glb')).toBe('/custom/tree.glb');
  });

  it('resolves registry defaults when no override', () => {
    expect(resolveModelUrl('furniture', 'sofa')).toBe('/models/furniture/sofa.glb');
    expect(resolveModelUrl('landscape', 'rock')).toBe('/models/landscape/rock.glb');
  });

  it('returns undefined for unknown types', () => {
    expect(resolveModelUrl('furniture', 'unknown_type')).toBeUndefined();
    expect(resolveModelUrl('landscape', 'unknown_type')).toBeUndefined();
  });

  it('computes footprint scale from bbox and minY', () => {
    const fit = computeFootprintScale({ x: 2, y: 1, z: 1 }, 1.4, 2.0, -0.5);
    expect(fit.scale).toBeCloseTo(0.7);
    expect(fit.groundOffsetY).toBeCloseTo(0.35);
  });

  it('lists unique preload URLs and expected files', () => {
    const urls = getAllSceneModelUrls();
    const expectedCount =
      Object.keys(FURNITURE_MODEL_PATHS).length + Object.keys(LANDSCAPE_MODEL_PATHS).length;
    expect(urls.length).toBe(expectedCount);
    expect(new Set(urls).size).toBe(urls.length);
    expect(getExpectedModelFiles()[0]).toMatch(/^public\/models\//);
  });

  it('applies optional per-type scale tuning', () => {
    expect(getModelScaleTuning('furniture', 'chair')).toBe(0.85);
    expect(getModelScaleTuning('landscape', 'unknown')).toBe(1);
  });
});
