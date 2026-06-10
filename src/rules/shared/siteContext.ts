import type { SitePlan } from '@/domain/buildings/generatedBuilding';
import type { Point2D, ProjectManifest } from '@/types';

export function getSitePlanFromManifest(manifest: ProjectManifest): SitePlan | null {
  const raw = manifest.metadata?.aiDesigner;
  if (!raw || typeof raw !== 'object') return null;
  const sitePlan = (raw as { sitePlan?: SitePlan }).sitePlan;
  if (!sitePlan?.parcelBoundary?.length || !sitePlan.buildingFootprint?.length) return null;
  return sitePlan;
}

function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function footprintInsideParcel(footprint: Point2D[], parcel: Point2D[]): boolean {
  return footprint.every((p) => pointInPolygon(p, parcel));
}

export function polygonAreaPx(points: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}
