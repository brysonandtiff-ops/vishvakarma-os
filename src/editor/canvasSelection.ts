import type { Point2D, Wall } from '@/types';

export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function normalizeSelectionRect(rect: SelectionRect) {
  const left = Math.min(rect.x1, rect.x2);
  const top = Math.min(rect.y1, rect.y2);
  const width = Math.abs(rect.x2 - rect.x1);
  const height = Math.abs(rect.y2 - rect.y1);
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function pointInRect(point: Point2D, rect: SelectionRect): boolean {
  const { left, top, right, bottom } = normalizeSelectionRect(rect);
  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

function wallIntersectsRect(wall: Wall, rect: SelectionRect): boolean {
  if (pointInRect(wall.start, rect) || pointInRect(wall.end, rect)) return true;
  const mid: Point2D = {
    x: (wall.start.x + wall.end.x) / 2,
    y: (wall.start.y + wall.end.y) / 2,
  };
  return pointInRect(mid, rect);
}

/** Returns wall ids whose geometry intersects the marquee rectangle. */
export function wallsInSelectionRect(walls: Wall[], rect: SelectionRect, minSize = 10): string[] {
  const { width, height } = normalizeSelectionRect(rect);
  if (width < minSize && height < minSize) return [];
  return walls.filter((wall) => wallIntersectsRect(wall, rect)).map((wall) => wall.id);
}

export function toggleWallInSelection(selectedIds: string[], wallId: string, additive: boolean): string[] {
  if (!additive) return [wallId];
  if (selectedIds.includes(wallId)) {
    const next = selectedIds.filter((id) => id !== wallId);
    return next.length ? next : [];
  }
  return [...selectedIds, wallId];
}

export function isWallSelected(
  wallId: string,
  selectedWallId?: string,
  selectedWallIds?: string[],
): boolean {
  if (selectedWallIds?.includes(wallId)) return true;
  return selectedWallId === wallId;
}

export function resolveSelectedWallIds(selectedWallId?: string, selectedWallIds?: string[]): string[] {
  if (selectedWallIds?.length) return selectedWallIds;
  return selectedWallId ? [selectedWallId] : [];
}
