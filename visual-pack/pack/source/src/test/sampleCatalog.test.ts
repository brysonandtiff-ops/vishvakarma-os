import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { validateManifest } from '@/core/manifestSchema';
import { FloorPlanEngine } from '@/core/floorPlanEngine';
import {
  buildSampleManifest,
  DEFAULT_SAMPLE_ID,
  getSampleDefinition,
  getSamplesForSurface,
  SAMPLE_CATALOG,
} from '@/core/sampleCatalog';

function loadJsonSample(relativePath: string) {
  const filePath = resolve(process.cwd(), 'public', relativePath.replace(/^\//, ''));
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function resolveManifestForSample(id: string) {
  const sample = getSampleDefinition(id);
  if (!sample) throw new Error(`Missing sample: ${id}`);

  if (sample.source.kind === 'builder') {
    return sample.source.build();
  }

  return loadJsonSample(sample.source.path);
}

describe('sample catalog', () => {
  it('has unique sample ids', () => {
    const ids = SAMPLE_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the default onboarding sample', () => {
    expect(getSampleDefinition(DEFAULT_SAMPLE_ID)?.name).toBe('Sample House 01');
  });

  it('validates every catalog manifest', () => {
    for (const sample of SAMPLE_CATALOG) {
      const manifest = resolveManifestForSample(sample.id);
      const result = validateManifest(manifest);
      expect(result.valid, `${sample.id}: ${result.errors.map((e) => e.message).join('; ')}`).toBe(true);
      expect(manifest.walls.length).toBeGreaterThan(0);
      expect(Array.isArray(manifest.openings)).toBe(true);
    }
  });

  it('loads every catalog manifest into the floor plan engine', () => {
    for (const sample of SAMPLE_CATALOG) {
      FloorPlanEngine.resetInstance();
      const engine = FloorPlanEngine.getInstance();
      const manifest = resolveManifestForSample(sample.id);
      expect(() => engine.loadManifest(manifest, manifest.name)).not.toThrow();
      expect(engine.getWalls().length).toBeGreaterThan(0);
    }
  });

  it('covers showcase feature counts', () => {
    const furniture = resolveManifestForSample('furniture-showcase');
    expect(furniture.furniture?.length).toBeGreaterThanOrEqual(8);

    const landscape = resolveManifestForSample('landscape-garden');
    expect(landscape.landscapeElements?.length).toBeGreaterThanOrEqual(12);
    expect(landscape.landscapeElements?.some((element) => element.type === 'water')).toBe(true);

    const terrainGarden = resolveManifestForSample('terrain-garden');
    expect(terrainGarden.terrain?.length).toBeGreaterThanOrEqual(3);
    expect(terrainGarden.landscapeElements?.length).toBeGreaterThanOrEqual(12);

    const mep = resolveManifestForSample('mep-lighting-showcase');
    expect(mep.mepSymbols?.length).toBe(4);
    expect(mep.fixtures?.length).toBe(3);

    const full = resolveManifestForSample('full-feature-showcase');
    expect(full.furniture?.length).toBeGreaterThanOrEqual(8);
    expect(full.landscapeElements?.length).toBeGreaterThanOrEqual(12);
    expect(full.mepSymbols?.length).toBeGreaterThan(0);
    expect(full.fixtures?.length).toBeGreaterThan(0);
    expect(full.dimensions?.length).toBeGreaterThan(0);
  });

  it('exposes new-project templates for residential and shapes', () => {
    const newProject = getSamplesForSurface('new-project');
    expect(newProject.some((entry) => entry.id === 'studio')).toBe(true);
    expect(newProject.some((entry) => entry.id === 'family-home-4br')).toBe(true);
    expect(newProject.some((entry) => entry.id === 'l-shape-home')).toBe(true);
  });

  it('builder registry supports showcase regeneration', () => {
    expect(buildSampleManifest('furniture-showcase').name).toBe('Furniture Showcase');
  });
});

describe('public sample json files', () => {
  it('parses every json file under public/samples', () => {
    const samplesDir = resolve(process.cwd(), 'public', 'samples');
    const files = readdirSync(samplesDir).filter((name) => name.endsWith('.json'));

    for (const file of files) {
      const manifest = JSON.parse(readFileSync(resolve(samplesDir, file), 'utf-8'));
      const result = validateManifest(manifest);
      expect(result.valid, `${file}: ${result.errors.map((e) => e.message).join('; ')}`).toBe(true);
    }
  });
});
