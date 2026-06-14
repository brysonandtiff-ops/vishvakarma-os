import { createProjectManifest } from '@/core/projectModel';
import type { ProjectManifest, Wall } from '@/types';

const DXF_SCALE = 20;

function mapPoint(x: number, y: number): { x: number; y: number } {
  return { x: x * DXF_SCALE + 200, y: -y * DXF_SCALE + 400 };
}

export interface DxfImportResult {
  manifest: ProjectManifest;
  warnings: string[];
}

function parseDxfLines(content: string): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines = content.split(/\r?\n/);
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() !== 'LINE') continue;

    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;
    let hasStart = false;
    let hasEnd = false;

    for (let j = i + 1; j < Math.min(i + 40, lines.length - 1); j += 2) {
      const code = lines[j].trim();
      const value = lines[j + 1]?.trim() ?? '';
      if (code === '0') break;
      if (code === '10') {
        x1 = Number.parseFloat(value);
        hasStart = true;
      } else if (code === '20') {
        y1 = Number.parseFloat(value);
      } else if (code === '11') {
        x2 = Number.parseFloat(value);
        hasEnd = true;
      } else if (code === '21') {
        y2 = Number.parseFloat(value);
      }
    }

    if (hasStart && hasEnd) {
      segments.push({ x1, y1, x2, y2 });
    }
  }

  return segments;
}

export function importDxfToManifest(content: string, projectName = 'Imported DXF'): DxfImportResult {
  const warnings: string[] = [];
  const segments = parseDxfLines(content);

  if (segments.length === 0) {
    throw new Error('DXF import found no LINE entities. Export walls as LINE geometry.');
  }

  const walls: Wall[] = segments.map((segment, index) => {
    const start = mapPoint(segment.x1, segment.y1);
    const end = mapPoint(segment.x2, segment.y2);
    return {
      id: `wall-dxf-${index}`,
      start,
      end,
      thickness: 10,
      height: 240,
      material: 'material-paint',
    };
  });

  warnings.push('DXF scale assumed at 20px per drawing unit — verify dimensions after import.');

  const manifest = createProjectManifest({
    name: projectName.replace(/\.dxf$/i, ''),
    walls,
    openings: [],
  });

  return { manifest, warnings };
}
