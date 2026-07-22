import type { Point2D, ProjectManifest } from '@/types';

export function scaleManifestGeometry(manifest: ProjectManifest, scale: number): ProjectManifest {
  if (scale === 1 || !Number.isFinite(scale)) return manifest;

  const points: Point2D[] = manifest.walls.flatMap((w) => [w.start, w.end]);
  if (points.length === 0) return manifest;

  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

  const mapPoint = (p: Point2D): Point2D => ({
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale,
  });

  return {
    ...manifest,
    walls: manifest.walls.map((w) => ({
      ...w,
      start: mapPoint(w.start),
      end: mapPoint(w.end),
    })),
    labels: (manifest.labels ?? []).map((l) => ({ ...l, position: mapPoint(l.position) })),
    rooms: (manifest.rooms ?? []).map((r) => ({
      ...r,
      center: r.center ? mapPoint(r.center) : r.center,
      area: r.area ? r.area * scale * scale : r.area,
    })),
    furniture: (manifest.furniture ?? []).map((f) => ({ ...f, position: mapPoint(f.position) })),
    mepSymbols: (manifest.mepSymbols ?? []).map((m) => ({ ...m, position: mapPoint(m.position) })),
    fixtures: (manifest.fixtures ?? []).map((f) => ({ ...f, position: mapPoint(f.position) })),
    landscapeElements: (manifest.landscapeElements ?? []).map((e) => ({
      ...e,
      position: mapPoint(e.position),
    })),
    terrain: (manifest.terrain ?? []).map((t) => ({
      ...t,
      points: t.points.map(mapPoint),
    })),
    staircases: (manifest.staircases ?? []).map((s) => ({ ...s, position: mapPoint(s.position) })),
  };
}
