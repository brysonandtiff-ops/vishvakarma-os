import { createProjectManifest } from '@/core/projectModel';
import type { ProjectManifest, Wall } from '@/types';

const DXF_SCALE = 20;

/** Layers treated as wall geometry when present (case-insensitive substring match). */
export const DEFAULT_WALL_LAYER_PATTERNS = ['WALL', 'A-WALL', 'A_WALL', 'PARTITION'] as const;

function mapPoint(x: number, y: number): { x: number; y: number } {
  return { x: x * DXF_SCALE + 200, y: -y * DXF_SCALE + 400 };
}

export interface DxfImportStats {
  lineEntities: number;
  lwPolylineEntities: number;
  segmentsImported: number;
  segmentsSkipped: number;
  layersSeen: string[];
  layersImported: string[];
  layersSkipped: string[];
}

export interface DxfImportResult {
  manifest: ProjectManifest;
  warnings: string[];
  stats: DxfImportStats;
}

type DxfSegment = { x1: number; y1: number; x2: number; y2: number; layer: string };

export interface DxfImportOptions {
  /** When set, only import entities on matching layers. Defaults to wall-like layer names. */
  wallLayerPatterns?: readonly string[];
  /** Import all layers when no wall-like layers are detected. Default true. */
  importAllLayersFallback?: boolean;
}

function layerMatchesPatterns(layer: string, patterns: readonly string[]): boolean {
  const upper = layer.toUpperCase();
  return patterns.some((pattern) => upper.includes(pattern.toUpperCase()));
}

function parseEntityLayer(lines: string[], entityIndex: number): string {
  for (let j = entityIndex + 1; j < Math.min(entityIndex + 40, lines.length - 1); j += 2) {
    const code = lines[j].trim();
    const value = lines[j + 1]?.trim() ?? '';
    if (code === '0') break;
    if (code === '8') return value || '0';
  }
  return '0';
}

function parseDxfLines(content: string): DxfSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: DxfSegment[] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() !== 'LINE') continue;

    const layer = parseEntityLayer(lines, i);
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
      segments.push({ x1, y1, x2, y2, layer });
    }
  }

  return segments;
}

function parseDxfLwpolylines(content: string): Array<{
  points: Array<{ x: number; y: number }>;
  closed: boolean;
  layer: string;
}> {
  const lines = content.split(/\r?\n/);
  const polylines: Array<{
    points: Array<{ x: number; y: number }>;
    closed: boolean;
    layer: string;
  }> = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() !== 'LWPOLYLINE') continue;

    const layer = parseEntityLayer(lines, i);
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
      polylines.push({ points, closed, layer });
    }
  }

  return polylines;
}

function segmentsFromPolyline(
  points: Array<{ x: number; y: number }>,
  closed: boolean,
  layer: string,
): DxfSegment[] {
  const segments: DxfSegment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    segments.push({
      x1: points[i].x,
      y1: points[i].y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
      layer,
    });
  }
  if (closed && points.length >= 3) {
    const last = points[points.length - 1];
    const first = points[0];
    segments.push({ x1: last.x, y1: last.y, x2: first.x, y2: first.y, layer });
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

function filterSegmentsByLayer(
  segments: DxfSegment[],
  options: DxfImportOptions,
): { imported: DxfSegment[]; skipped: DxfSegment[]; layersSeen: string[] } {
  const layersSeen = [...new Set(segments.map((s) => s.layer))];
  const patterns = options.wallLayerPatterns ?? DEFAULT_WALL_LAYER_PATTERNS;
  const wallLayers = layersSeen.filter((layer) => layerMatchesPatterns(layer, patterns));

  let activeLayers: Set<string>;
  if (wallLayers.length > 0) {
    activeLayers = new Set(wallLayers);
  } else if (options.importAllLayersFallback !== false) {
    activeLayers = new Set(layersSeen);
  } else {
    activeLayers = new Set();
  }

  const imported = segments.filter((s) => activeLayers.has(s.layer));
  const skipped = segments.filter((s) => !activeLayers.has(s.layer));
  return { imported, skipped, layersSeen };
}

export function importDxfToManifest(
  content: string,
  projectName = 'Imported DXF',
  options: DxfImportOptions = {},
): DxfImportResult {
  const warnings: string[] = [];
  const lineSegments = parseDxfLines(content);
  const polylineSegments = parseDxfLwpolylines(content).flatMap((polyline) =>
    segmentsFromPolyline(polyline.points, polyline.closed, polyline.layer),
  );
  const allSegments = [...lineSegments, ...polylineSegments];

  if (allSegments.length === 0) {
    throw new Error('DXF import found no LINE or LWPOLYLINE wall geometry.');
  }

  const { imported, skipped, layersSeen } = filterSegmentsByLayer(allSegments, options);
  const layersImported = [...new Set(imported.map((s) => s.layer))];
  const layersSkipped = [...new Set(skipped.map((s) => s.layer))];

  if (imported.length === 0) {
    throw new Error(
      `DXF import found geometry but no segments matched wall layers: ${layersSeen.join(', ')}`,
    );
  }

  const stats: DxfImportStats = {
    lineEntities: lineSegments.length,
    lwPolylineEntities: parseDxfLwpolylines(content).length,
    segmentsImported: imported.length,
    segmentsSkipped: skipped.length,
    layersSeen,
    layersImported,
    layersSkipped,
  };

  if (polylineSegments.length > 0 && lineSegments.length === 0) {
    warnings.push('Imported LWPOLYLINE entities only — verify closed loops became wall segments.');
  }
  if (lineSegments.length > 0 && polylineSegments.length === 0) {
    warnings.push('Imported LINE entities only.');
  }
  if (layersSkipped.length > 0) {
    warnings.push(
      `Skipped layers (${layersSkipped.join(', ')}) — not matched as wall layers. Imported: ${layersImported.join(', ')}.`,
    );
  }
  if (layersImported.length > 0 && layersImported.some((l) => layerMatchesPatterns(l, DEFAULT_WALL_LAYER_PATTERNS))) {
    warnings.push(`Wall layer mapping applied (${layersImported.join(', ')}).`);
  }

  warnings.push('DXF scale assumed at 20px per drawing unit — verify dimensions after import.');

  const walls = wallsFromSegments(imported, 'wall-dxf');
  const manifest = createProjectManifest({
    name: projectName.replace(/\.dxf$/i, ''),
    walls,
    openings: [],
  });

  return { manifest, warnings, stats };
}
