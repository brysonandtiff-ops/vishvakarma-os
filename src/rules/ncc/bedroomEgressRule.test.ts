import { describe, expect, it } from 'vitest';
import { bedroomEgressRule } from '@/rules/ncc/bedroomEgressRule';
import type { Project, ProjectManifest } from '@/types';

function bedroomWithoutEgressManifest(): ProjectManifest {
  return {
    version: '1.0.0',
    name: 'No Egress Bedroom',
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 200, y: 0 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w2', start: { x: 200, y: 0 }, end: { x: 200, y: 200 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w3', start: { x: 200, y: 200 }, end: { x: 0, y: 200 }, thickness: 10, height: 240, material: 'material-concrete' },
      { id: 'w4', start: { x: 0, y: 200 }, end: { x: 0, y: 0 }, thickness: 10, height: 240, material: 'material-concrete' },
    ],
    openings: [
      { id: 'door-ext', type: 'door', wallId: 'w1', position: 0.1, width: 90, height: 210 },
    ],
    rooms: [{ id: 'bed-1', name: 'Master Bedroom', wallIds: ['w1', 'w2', 'w3', 'w4'] }],
    materials: [],
    floorMaterial: 'material-wood',
    lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
    gridSize: 20,
    snapToGrid: true,
    metadata: { created: '2026-01-01T00:00:00Z', modified: '2026-01-01T00:00:00Z' },
  };
}

describe('BedroomEgressRule', () => {
  it('returns fail when bedroom has no door or window on room walls', () => {
    const manifest = bedroomWithoutEgressManifest();
    manifest.openings = [{ id: 'door-ext', type: 'door', wallId: 'w9', position: 0.5, width: 90, height: 210 }];
    const project: Project = {
      id: 'test',
      name: manifest.name,
      manifest,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = bedroomEgressRule.validate(project);
    expect(result.status).toBe('fail');
    expect(result.findings.some((f) => f.message.includes('no door or window'))).toBe(true);
  });

  it('returns warning when bedroom has window only', () => {
    const manifest = bedroomWithoutEgressManifest();
    manifest.openings = [
      { id: 'win-1', type: 'window', wallId: 'w2', position: 0.5, width: 120, height: 120, sillHeight: 90 },
    ];
    const project: Project = {
      id: 'test',
      name: manifest.name,
      manifest,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = bedroomEgressRule.validate(project);
    expect(result.status).toBe('warning');
    expect(result.findings.some((f) => f.message.includes('window only'))).toBe(true);
  });
});
