import type { ProjectManifest } from '@/types';

export function exportManifestToDxf(manifest: ProjectManifest): string {
  const lines: string[] = [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
  ];

  for (const wall of manifest.walls) {
    lines.push('0', 'LINE', '8', 'WALLS', '10', String(wall.start.x), '20', String(wall.start.y), '11', String(wall.end.x), '21', String(wall.end.y));
  }

  for (const opening of manifest.openings) {
    const layer = opening.type === 'door' ? 'DOORS' : 'WINDOWS';
    const wall = manifest.walls.find((w) => w.id === opening.wallId);
    if (!wall) continue;
    const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
    const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
    lines.push('0', 'LINE', '8', layer, '10', String(x), '20', String(y), '11', String(x + opening.width), '21', String(y));
  }

  for (const dim of manifest.dimensions ?? []) {
    lines.push(
      '0',
      'LINE',
      '8',
      'DIMENSIONS',
      '10',
      String(dim.start.x),
      '20',
      String(dim.start.y),
      '11',
      String(dim.end.x),
      '21',
      String(dim.end.y),
    );
  }

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}
