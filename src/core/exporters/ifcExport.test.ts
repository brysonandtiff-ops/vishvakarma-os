import { describe, it, expect } from 'vitest';
import { exportManifestToIfc } from './ifcExport';
import { createEmptyProjectManifest } from '@/core/projectModel';

function sampleManifest() {
  const manifest = createEmptyProjectManifest('IFC Test');
  manifest.walls.push({
    id: 'w1',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    thickness: 40,
    height: 560,
    material: 'material-concrete',
  });
  manifest.openings.push({
    id: 'd1',
    type: 'door',
    wallId: 'w1',
    position: 0.5,
    width: 18,
    height: 400,
  });
  manifest.openings.push({
    id: 'win1',
    type: 'window',
    wallId: 'w1',
    position: 0.8,
    width: 12,
    height: 240,
    sillHeight: 180,
  });
  return manifest;
}

describe('ifcExport', () => {
  const ifc = exportManifestToIfc(sampleManifest(), new Date('2026-06-18T00:00:00Z'));

  it('produces a valid ISO-10303-21 / IFC4 envelope', () => {
    expect(ifc.startsWith('ISO-10303-21;')).toBe(true);
    expect(ifc).toContain("FILE_SCHEMA(('IFC4'))");
    expect(ifc.trimEnd().endsWith('END-ISO-10303-21;')).toBe(true);
  });

  it('emits the spatial hierarchy and units', () => {
    expect(ifc).toContain('IFCPROJECT(');
    expect(ifc).toContain('IFCSITE(');
    expect(ifc).toContain('IFCBUILDING(');
    expect(ifc).toContain('IFCBUILDINGSTOREY(');
    expect(ifc).toContain('IFCRELAGGREGATES(');
    expect(ifc).toContain('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)');
  });

  it('emits walls, doors, and windows with geometry', () => {
    expect(ifc).toContain('IFCWALL(');
    expect(ifc).toContain('IFCDOOR(');
    expect(ifc).toContain('IFCWINDOW(');
    expect(ifc).toContain('IFCEXTRUDEDAREASOLID(');
    expect(ifc).toContain('IFCRELCONTAINEDINSPATIALSTRUCTURE(');
  });

  it('converts pixels to millimetres (100px wall → 500mm length)', () => {
    // wall midpoint x = 250mm, end length 500mm appear as rectangle XDim
    expect(ifc).toContain('IFCRECTANGLEPROFILEDEF(.AREA.,\'Wall\',');
    expect(ifc).toContain('500.');
  });

  it('assigns unique 22-character GlobalIds', () => {
    const guids = [...ifc.matchAll(/IFC(?:PROJECT|SITE|BUILDING|BUILDINGSTOREY|WALL|DOOR|WINDOW)\('([^']+)'/g)].map(
      (m) => m[1],
    );
    expect(guids.length).toBeGreaterThan(0);
    for (const g of guids) expect(g).toHaveLength(22);
    expect(new Set(guids).size).toBe(guids.length);
  });
});
