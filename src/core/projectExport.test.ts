import { createProjectManifest } from './projectModel';
import {
  buildProjectExportFilename,
  parseProjectManifestJson,
  roundTripProjectManifest,
  serializeProjectManifest,
} from './projectExport';

describe('projectExport', () => {
  it('builds safe deterministic export filenames', () => {
    expect(buildProjectExportFilename({ name: 'Client Floor Plan' })).toBe('client-floor-plan-floor-plan.json');
    expect(buildProjectExportFilename({ name: '  Luxury / Villa #42!  ' })).toBe('luxury-villa-42-floor-plan.json');
    expect(buildProjectExportFilename({ name: '   ' })).toBe('untitled-project-floor-plan.json');
  });

  it('serializes project manifests as readable JSON', () => {
    const manifest = createProjectManifest({ name: 'Export Proof' });
    const json = serializeProjectManifest(manifest);

    expect(json).toContain('"name": "Export Proof"');
    expect(json).toContain('"walls": []');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('round-trips a valid manifest without losing core project state', () => {
    const manifest = createProjectManifest({
      name: 'Round Trip Proof',
      walls: [
        {
          id: 'wall-1',
          start: { x: 0, y: 0 },
          end: { x: 240, y: 0 },
          thickness: 10,
          height: 240,
          material: 'material-paint',
        },
      ],
      openings: [
        {
          id: 'door-1',
          type: 'door',
          wallId: 'wall-1',
          position: 0.5,
          width: 90,
          height: 210,
        },
      ],
    });

    const result = roundTripProjectManifest(manifest);

    expect(result.ok).toBe(true);
    expect(result.manifest?.name).toBe('Round Trip Proof');
    expect(result.manifest?.walls).toHaveLength(1);
    expect(result.manifest?.openings).toHaveLength(1);
    expect(result.manifest?.lighting).toEqual(manifest.lighting);
  });

  it('rejects invalid JSON imports', () => {
    const result = parseProjectManifestJson('{not json');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Imported file is not valid JSON.');
  });

  it('rejects JSON that is not a project manifest', () => {
    const result = parseProjectManifestJson(JSON.stringify({ name: 'Missing required fields' }));

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Imported file is not a Vishvakarma.OS project manifest.');
  });
});
