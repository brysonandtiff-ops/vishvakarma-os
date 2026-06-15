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

type DxfSegment = { x1: number; y1: number; x2: number; y2: number };

function parseDxfLines(content: string): DxfSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: DxfSegment[] = [];

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

function parseDxfLwpolylines(content: string): Array<{ points: Array<{ x: number; y: number }>; closed: boolean }> {
  const lines = content.split(/\r?\n/);
  const polylines: Array<{ points: Array<{ x: number; y: number }>; closed: boolean }> = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() !== 'LWPOLYLINE') continue;

    let closed = false;
    const points: Array<{ x: number; y: number }> = [];
    let pendingX: number | null = null;

    for (let j = i + 1; j < lines.length - 1; j += 2) {
      const code = lines[j].trim();
      const value = lines[j + 1]?.trim() ?? '';
      if (code === '0') break;
      if (code === '70') {
        const flags = Number.parseInt(value, 10);
        closed = (flags & 1) === 1;
      } else if (code === '10') {
        pendingX = Number.parseFloat(value);
      } else if (code === '20' && pendingX !== null) {
        points.push({ x: pendingX, y: Number.parseFloat(value) });
        pendingX = null;
      }
    }

    if (points.length >= 2) {
      polylines.push({ points, closed });
    }
  }

  return polylines;
}

function segmentsFromPolyline(points: Array<{ x: number; y: number }>, closed: boolean): DxfSegment[] {
  const segments: DxfSegment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    segments.push({
      x1: points[i].x,
      y1: points[i].y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
    });
  }
  if (closed && points.length >= 3) {
    const last = points[points.length - 1];
    const first = points[0];
    segments.push({ x1: last.x, y1: last.y, x2: first.x, y2: first.y });
  }
  return segments;
}

function wallsFromSegments(segments: DxfSegment[], idPrefix: string): Wall[] {
  return segments.map((segment, index) => {
    const start = mapPoint(segment.x1, segment.y1);
    const end = mapPoint(segment.x2, segment.y2);
    return {
      id: `${idPrefix}-${index}`,
      start,
      end,
      thickness: 10,
      height: 240,
      material: 'material-paint',
    };
  });
}

export function importDxfToManifest(content: string, projectName = 'Imported DXF'): DxfImportResult {
  const warnings: string[] = [];
  const lineSegments = parseDxfLines(content);
  const polylineSegments = parseDxfLwpolylines(content).flatMap((polyline) =>
    segmentsFromPolyline(polyline.points, polyline.closed),
  );
  const segments = [...lineSegments, ...polylineSegments];

  if (segments.length === 0) {
    throw new Error('DXF import found no LINE or LWPOLYLINE wall geometry.');
  }

  if (lineSegments.length === 0 && polylineSegments.length > 0) {
    warnings.push('Imported LWPOLYLINE entities only — verify closed loops became wall segments.');
  }
  if (polylineSegments.length === 0 && lineSegments.length > 0) {
    warnings.push('Imported LINE entities only.');
  }

  const walls = wallsFromSegments(segments, 'wall-dxf');

  warnings.push('DXF scale assumed at 20px per drawing unit — verify dimensions after import.');

  const manifest = createProjectManifest({
    name: projectName.replace(/\.dxf$/i, ''),
    walls,
    openings: [],
  });

  return { manifest, warnings };
}
