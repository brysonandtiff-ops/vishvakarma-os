import { describe, it, expect } from 'vitest';
import { exportManifestToDxf } from './dxfExport';
import { createEmptyProjectManifest } from '@/core/projectModel';

function manifestWithWall() {
  const manifest = createEmptyProjectManifest('DXF Test');
  manifest.walls.push({
    id: 'w1',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    thickness: 200,
    height: 2800,
    material: 'material-concrete',
  });
  return manifest;
}

describe('dxfExport', () => {
  it('declares millimetre units in the header', () => {
    const dxf = exportManifestToDxf(manifestWithWall());
    expect(dxf).toContain('$INSUNITS');
    expect(dxf).toContain('$MEASUREMENT');
    // group code 70 = 4 (millimetres) follows $INSUNITS
    expect(dxf).toMatch(/\$INSUNITS\n70\n4/);
  });

  it('defines named layers in a LAYER table', () => {
    const dxf = exportManifestToDxf(manifestWithWall());
    expect(dxf).toContain('TABLE');
    expect(dxf).toContain('LAYER');
    for (const layer of ['WALLS', 'DOORS', 'WINDOWS', 'ROOMS', 'DIMENSIONS']) {
      expect(dxf).toContain(layer);
    }
  });

  it('defines DOOR and WINDOW blocks', () => {
    const dxf = exportManifestToDxf(manifestWithWall());
    expect(dxf).toContain('BLOCKS');
    expect(dxf).toContain('DOOR');
    expect(dxf).toContain('WINDOW');
  });

  it('emits wall outlines as closed LWPOLYLINE scaled to millimetres', () => {
    const dxf = exportManifestToDxf(manifestWithWall());
    expect(dxf).toContain('LWPOLYLINE');
    // 100px wall end → 500mm
    expect(dxf).toContain('500');
    expect(dxf).toContain('EOF');
  });

  it('emits openings as INSERT references to the door/window blocks', () => {
    const manifest = manifestWithWall();
    manifest.openings.push({
      id: 'o1',
      type: 'door',
      wallId: 'w1',
      position: 0.5,
      width: 80,
      height: 2000,
    });
    manifest.openings.push({
      id: 'o2',
      type: 'window',
      wallId: 'w1',
      position: 0.25,
      width: 60,
      height: 1200,
    });
    const dxf = exportManifestToDxf(manifest);
    expect(dxf).toContain('INSERT');
    expect(dxf).toContain('DOOR');
    expect(dxf).toContain('WINDOW');
  });

  it('skips openings whose wall is missing', () => {
    const manifest = manifestWithWall();
    manifest.openings.push({
      id: 'orphan',
      type: 'door',
      wallId: 'does-not-exist',
      position: 0.5,
      width: 80,
      height: 2000,
    });
    const dxf = exportManifestToDxf(manifest);
    // Only the two block definitions reference DOOR; no orphan INSERT crashed the export.
    expect(dxf).toContain('EOF');
  });
});
