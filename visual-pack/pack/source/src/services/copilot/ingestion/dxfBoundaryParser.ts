import type { Point2D } from '@/types';

/** Parse LWPOLYLINE or LINE entities from DXF into a closed boundary polygon. */
export function parseDxfBoundary(dxfContent: string): Point2D[] {
  const lines = dxfContent.split(/\r?\n/).map((l) => l.trim());
  const points: Point2D[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const code = lines[i];
    const value = lines[i + 1];
    if (code === '0' && (value === 'LWPOLYLINE' || value === 'POLYLINE')) {
      const polyPoints = parsePolylineEntity(lines, i);
      if (polyPoints.length >= 3) {
        return polyPoints;
      }
    }
  }

  const linePoints = parseLineEntities(lines);
  if (linePoints.length >= 3) {
    return linePoints;
  }

  return points;
}

function parsePolylineEntity(lines: string[], startIndex: number): Point2D[] {
  const points: Point2D[] = [];
  let x: number | null = null;

  for (let i = startIndex + 2; i < lines.length; i += 2) {
    const code = lines[i];
    const value = lines[i + 1];
    if (code === '0') break;

    if (code === '10') {
      x = Number(value);
    } else if (code === '20' && x !== null) {
      points.push({ x, y: Number(value) });
      x = null;
    }
  }

  return closePolygon(points);
}

function parseLineEntities(lines: string[]): Point2D[] {
  const vertices = new Map<string, Point2D>();

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] !== '0' || lines[i + 1] !== 'LINE') continue;

    let x1: number | null = null;
    let y1: number | null = null;
    let x2: number | null = null;
    let y2: number | null = null;

    for (let j = i + 2; j < lines.length; j += 2) {
      const code = lines[j];
      const value = lines[j + 1];
      if (code === '0') break;
      if (code === '10') x1 = Number(value);
      if (code === '20') y1 = Number(value);
      if (code === '11') x2 = Number(value);
      if (code === '21') y2 = Number(value);
    }

    if (x1 !== null && y1 !== null) {
      vertices.set(`${x1},${y1}`, { x: x1, y: y1 });
    }
    if (x2 !== null && y2 !== null) {
      vertices.set(`${x2},${y2}`, { x: x2, y: y2 });
    }
  }

  return closePolygon([...vertices.values()]);
}

function closePolygon(points: Point2D[]): Point2D[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.x !== last.x || first.y !== last.y) {
    return [...points, { ...first }];
  }
  return points;
}

export function boundaryMetricsFromPolygon(polygon: Point2D[]): {
  widthM: number;
  depthM: number;
  areaSqM: number;
} {
  if (polygon.length < 3) {
    return { widthM: 20, depthM: 20, areaSqM: 400 };
  }

  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const widthPx = Math.max(...xs) - Math.min(...xs);
  const depthPx = Math.max(...ys) - Math.min(...ys);

  const pxPerMeter = 20;
  let areaPx = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const j = (i + 1) % polygon.length;
    areaPx += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  areaPx = Math.abs(areaPx) / 2;

  return {
    widthM: Math.round((widthPx / pxPerMeter) * 10) / 10,
    depthM: Math.round((depthPx / pxPerMeter) * 10) / 10,
    areaSqM: Math.round(areaPx / (pxPerMeter * pxPerMeter)),
  };
}
