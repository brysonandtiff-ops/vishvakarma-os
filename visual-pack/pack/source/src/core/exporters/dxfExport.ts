import type { ProjectManifest, Wall } from '@/types';
import { getVerticesForRoom } from '@/utils/roomCalculations';

// Manifest geometry is stored in pixels (PX_TO_CM = 0.5 → 1px = 5mm). CAD deliverables
// must be in real-world units, so all coordinates are scaled to millimetres and the DXF
// header declares millimetre units.
const PX_TO_MM = 5;
const mm = (px: number) => Number((px * PX_TO_MM).toFixed(3));

type LayerDef = { name: string; color: number };

// ACI color indices: 1=red 3=green 5=blue 7=white/black 8=gray.
const LAYERS: LayerDef[] = [
  { name: 'WALLS', color: 7 },
  { name: 'ROOMS', color: 8 },
  { name: 'DOORS', color: 3 },
  { name: 'WINDOWS', color: 5 },
  { name: 'DIMENSIONS', color: 1 },
];

function pair(out: string[], code: number | string, value: number | string): void {
  out.push(String(code), String(value));
}

function header(out: string[]): void {
  pair(out, 0, 'SECTION');
  pair(out, 2, 'HEADER');
  pair(out, 9, '$ACADVER');
  pair(out, 1, 'AC1015'); // AutoCAD 2000 — supports LWPOLYLINE
  pair(out, 9, '$INSUNITS');
  pair(out, 70, 4); // 4 = millimetres
  pair(out, 9, '$MEASUREMENT');
  pair(out, 70, 1); // 1 = metric
  pair(out, 0, 'ENDSEC');
}

function tables(out: string[]): void {
  pair(out, 0, 'SECTION');
  pair(out, 2, 'TABLES');
  pair(out, 0, 'TABLE');
  pair(out, 2, 'LAYER');
  pair(out, 70, LAYERS.length);
  for (const layer of LAYERS) {
    pair(out, 0, 'LAYER');
    pair(out, 2, layer.name);
    pair(out, 70, 0);
    pair(out, 62, layer.color);
    pair(out, 6, 'CONTINUOUS');
  }
  pair(out, 0, 'ENDTAB');
  pair(out, 0, 'ENDSEC');
}

/** Door symbol: opening line, swinging leaf, and a quarter-circle swing arc (unit size). */
function doorBlockBody(out: string[]): void {
  pair(out, 0, 'LINE'); pair(out, 8, 'DOORS'); pair(out, 10, 0); pair(out, 20, 0); pair(out, 11, 1); pair(out, 21, 0);
  pair(out, 0, 'LINE'); pair(out, 8, 'DOORS'); pair(out, 10, 0); pair(out, 20, 0); pair(out, 11, 0); pair(out, 21, 1);
  pair(out, 0, 'ARC'); pair(out, 8, 'DOORS'); pair(out, 10, 0); pair(out, 20, 0); pair(out, 40, 1); pair(out, 50, 0); pair(out, 51, 90);
}

/** Window symbol: a thin rectangle (unit size, scaled by opening width on INSERT). */
function windowBlockBody(out: string[]): void {
  const verts: Array<[number, number]> = [
    [0, -0.1],
    [1, -0.1],
    [1, 0.1],
    [0, 0.1],
  ];
  for (let i = 0; i < verts.length; i++) {
    const [x1, y1] = verts[i];
    const [x2, y2] = verts[(i + 1) % verts.length];
    pair(out, 0, 'LINE'); pair(out, 8, 'WINDOWS');
    pair(out, 10, x1); pair(out, 20, y1); pair(out, 11, x2); pair(out, 21, y2);
  }
}

function blocks(out: string[]): void {
  pair(out, 0, 'SECTION');
  pair(out, 2, 'BLOCKS');

  pair(out, 0, 'BLOCK'); pair(out, 8, 'DOORS'); pair(out, 2, 'DOOR'); pair(out, 70, 0);
  pair(out, 10, 0); pair(out, 20, 0); pair(out, 30, 0); pair(out, 3, 'DOOR');
  doorBlockBody(out);
  pair(out, 0, 'ENDBLK'); pair(out, 8, 'DOORS');

  pair(out, 0, 'BLOCK'); pair(out, 8, 'WINDOWS'); pair(out, 2, 'WINDOW'); pair(out, 70, 0);
  pair(out, 10, 0); pair(out, 20, 0); pair(out, 30, 0); pair(out, 3, 'WINDOW');
  windowBlockBody(out);
  pair(out, 0, 'ENDBLK'); pair(out, 8, 'WINDOWS');

  pair(out, 0, 'ENDSEC');
}

/** Closed LWPOLYLINE from a list of [x,y] points already in millimetres. */
function lwpolyline(out: string[], layer: string, points: Array<[number, number]>): void {
  pair(out, 0, 'LWPOLYLINE');
  pair(out, 8, layer);
  pair(out, 90, points.length);
  pair(out, 70, 1); // closed
  for (const [x, y] of points) {
    pair(out, 10, x);
    pair(out, 20, y);
  }
}

/** Rectangular wall outline (thickness offset perpendicular to the wall centerline). */
function wallOutline(wall: Wall): Array<[number, number]> | null {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const half = (wall.thickness ?? 100) / 2;
  // perpendicular unit vector
  const px = -uy * half;
  const py = ux * half;
  return [
    [mm(wall.start.x + px), mm(wall.start.y + py)],
    [mm(wall.end.x + px), mm(wall.end.y + py)],
    [mm(wall.end.x - px), mm(wall.end.y - py)],
    [mm(wall.start.x - px), mm(wall.start.y - py)],
  ];
}

export function exportManifestToDxf(manifest: ProjectManifest): string {
  const out: string[] = [];
  header(out);
  tables(out);
  blocks(out);

  pair(out, 0, 'SECTION');
  pair(out, 2, 'ENTITIES');

  // Walls as closed polyline outlines (fall back to centerline if degenerate).
  for (const wall of manifest.walls) {
    const outline = wallOutline(wall);
    if (outline) {
      lwpolyline(out, 'WALLS', outline);
    } else {
      pair(out, 0, 'LINE'); pair(out, 8, 'WALLS');
      pair(out, 10, mm(wall.start.x)); pair(out, 20, mm(wall.start.y));
      pair(out, 11, mm(wall.end.x)); pair(out, 21, mm(wall.end.y));
    }
  }

  // Room boundaries as closed polylines.
  for (const room of manifest.rooms ?? []) {
    const vertices = getVerticesForRoom(room, manifest.walls);
    if (vertices.length < 3) continue;
    lwpolyline(
      out,
      'ROOMS',
      vertices.map((v) => [mm(v.x), mm(v.y)] as [number, number]),
    );
  }

  // Openings as INSERTs of the DOOR / WINDOW blocks, rotated to the wall direction and
  // scaled to the opening width.
  for (const opening of manifest.openings) {
    const wall = manifest.walls.find((w) => w.id === opening.wallId);
    if (!wall) continue;
    const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
    const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
    const angle = (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
    const isDoor = opening.type === 'door';
    const layer = isDoor ? 'DOORS' : 'WINDOWS';
    const block = isDoor ? 'DOOR' : 'WINDOW';
    const scale = mm(opening.width);

    pair(out, 0, 'INSERT');
    pair(out, 8, layer);
    pair(out, 2, block);
    pair(out, 10, mm(x));
    pair(out, 20, mm(y));
    pair(out, 30, 0);
    pair(out, 41, scale);
    pair(out, 42, scale);
    pair(out, 43, 1);
    pair(out, 50, Number(angle.toFixed(3)));
  }

  // Dimension lines.
  for (const dim of manifest.dimensions ?? []) {
    pair(out, 0, 'LINE'); pair(out, 8, 'DIMENSIONS');
    pair(out, 10, mm(dim.start.x)); pair(out, 20, mm(dim.start.y));
    pair(out, 11, mm(dim.end.x)); pair(out, 21, mm(dim.end.y));
  }

  pair(out, 0, 'ENDSEC');
  pair(out, 0, 'EOF');
  return out.join('\n');
}
