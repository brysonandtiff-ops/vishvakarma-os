import type { FixtureItem, FurnitureItem, Opening, Point2D, Wall } from '@/types';
import { pointToLineDistance } from '@/components/editor/blueprintCanvasDrawing';

const DEFAULT_CELL = 120;

type CellKey = string;

function cellKey(cx: number, cy: number): CellKey {
  return `${cx},${cy}`;
}

function pointCell(point: Point2D, cellSize: number) {
  return {
    cx: Math.floor(point.x / cellSize),
    cy: Math.floor(point.y / cellSize),
  };
}

function wallBounds(wall: Wall, extraHitArea: number) {
  const pad = wall.thickness / 2 + extraHitArea;
  const minX = Math.min(wall.start.x, wall.end.x) - pad;
  const maxX = Math.max(wall.start.x, wall.end.x) + pad;
  const minY = Math.min(wall.start.y, wall.end.y) - pad;
  const maxY = Math.max(wall.start.y, wall.end.y) + pad;
  return { minX, maxX, minY, maxY };
}

export class SpatialIndex {
  private wallCells = new Map<CellKey, Wall[]>();
  private openingCells = new Map<CellKey, Opening[]>();
  private furnitureCells = new Map<CellKey, FurnitureItem[]>();
  private fixtureCells = new Map<CellKey, FixtureItem[]>();
  private walls: Wall[] = [];
  private openings: Opening[] = [];
  private furniture: FurnitureItem[] = [];
  private fixtures: FixtureItem[] = [];

  constructor(private cellSize = DEFAULT_CELL) {}

  rebuild(input: {
    walls: Wall[];
    openings: Opening[];
    furniture: FurnitureItem[];
    fixtures: FixtureItem[];
  }) {
    this.walls = input.walls;
    this.openings = input.openings;
    this.furniture = input.furniture;
    this.fixtures = input.fixtures;
    this.wallCells.clear();
    this.openingCells.clear();
    this.furnitureCells.clear();
    this.fixtureCells.clear();

    for (const wall of input.walls) {
      this.insertWall(wall);
    }
    for (const opening of input.openings) {
      this.insertOpening(opening);
    }
    for (const item of input.furniture) {
      this.insertFurniture(item);
    }
    for (const fixture of input.fixtures) {
      this.insertFixture(fixture);
    }
  }

  private insertIntoCells<T>(
    map: Map<CellKey, T[]>,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    value: T,
  ) {
    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startY = Math.floor(minY / this.cellSize);
    const endY = Math.floor(maxY / this.cellSize);
    for (let cx = startX; cx <= endX; cx += 1) {
      for (let cy = startY; cy <= endY; cy += 1) {
        const key = cellKey(cx, cy);
        const bucket = map.get(key);
        if (bucket) bucket.push(value);
        else map.set(key, [value]);
      }
    }
  }

  private insertWall(wall: Wall) {
    const { minX, maxX, minY, maxY } = wallBounds(wall, 10);
    this.insertIntoCells(this.wallCells, minX, maxX, minY, maxY, wall);
  }

  private insertOpening(opening: Opening) {
    const wall = this.walls.find((w) => w.id === opening.wallId);
    if (!wall) return;
    const x = wall.start.x + (wall.end.x - wall.start.x) * opening.position;
    const y = wall.start.y + (wall.end.y - wall.start.y) * opening.position;
    this.insertIntoCells(this.openingCells, x - 20, x + 20, y - 20, y + 20, opening);
  }

  private insertFurniture(item: FurnitureItem) {
    const hw = (item.width ?? 80) / 2 + 8;
    const hd = (item.depth ?? 60) / 2 + 8;
    this.insertIntoCells(
      this.furnitureCells,
      item.position.x - hw,
      item.position.x + hw,
      item.position.y - hd,
      item.position.y + hd,
      item,
    );
  }

  private insertFixture(fixture: FixtureItem) {
    const r = 14;
    this.insertIntoCells(
      this.fixtureCells,
      fixture.position.x - r,
      fixture.position.x + r,
      fixture.position.y - r,
      fixture.position.y + r,
      fixture,
    );
  }

  private candidates<T>(map: Map<CellKey, T[]>, point: Point2D): T[] {
    const { cx, cy } = pointCell(point, this.cellSize);
    const seen = new Set<T>();
    const results: T[] = [];
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const bucket = map.get(cellKey(cx + dx, cy + dy));
        if (!bucket) continue;
        for (const item of bucket) {
          if (seen.has(item)) continue;
          seen.add(item);
          results.push(item);
        }
      }
    }
    return results;
  }

  findWallAtPoint(point: Point2D, extraHitArea = 10): Wall | undefined {
    for (const wall of this.candidates(this.wallCells, point)) {
      if (pointToLineDistance(point, wall.start, wall.end) < wall.thickness / 2 + extraHitArea) {
        return wall;
      }
    }
    return undefined;
  }

  findOpeningAtPoint(
    point: Point2D,
    hitRadius: number,
    positionFor: (opening: Opening) => number,
  ): Opening | undefined {
    for (const opening of this.candidates(this.openingCells, point)) {
      const wall = this.walls.find((w) => w.id === opening.wallId);
      if (!wall) continue;
      const pos = positionFor(opening);
      const x = wall.start.x + (wall.end.x - wall.start.x) * pos;
      const y = wall.start.y + (wall.end.y - wall.start.y) * pos;
      if (Math.hypot(point.x - x, point.y - y) < hitRadius) return opening;
    }
    return undefined;
  }

  findFurnitureAtPoint(point: Point2D, hitPad: number): FurnitureItem | undefined {
    for (const item of this.candidates(this.furnitureCells, point)) {
      const width = item.width ?? 80;
      const depth = item.depth ?? 60;
      if (
        Math.abs(point.x - item.position.x) < width / 2 + hitPad &&
        Math.abs(point.y - item.position.y) < depth / 2 + hitPad
      ) {
        return item;
      }
    }
    return undefined;
  }

  findFixtureAtPoint(point: Point2D, radius: number): FixtureItem | undefined {
    for (const fixture of this.candidates(this.fixtureCells, point)) {
      if (Math.hypot(point.x - fixture.position.x, point.y - fixture.position.y) <= radius) {
        return fixture;
      }
    }
    return undefined;
  }

  wallsInRect(left: number, top: number, right: number, bottom: number): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();
    const startX = Math.floor(left / this.cellSize);
    const endX = Math.floor(right / this.cellSize);
    const startY = Math.floor(top / this.cellSize);
    const endY = Math.floor(bottom / this.cellSize);
    for (let cx = startX; cx <= endX; cx += 1) {
      for (let cy = startY; cy <= endY; cy += 1) {
        const bucket = this.wallCells.get(cellKey(cx, cy));
        if (!bucket) continue;
        for (const wall of bucket) {
          if (seen.has(wall.id)) continue;
          seen.add(wall.id);
          const mid = {
            x: (wall.start.x + wall.end.x) / 2,
            y: (wall.start.y + wall.end.y) / 2,
          };
          if (
            (wall.start.x >= left && wall.start.x <= right && wall.start.y >= top && wall.start.y <= bottom) ||
            (wall.end.x >= left && wall.end.x <= right && wall.end.y >= top && wall.end.y <= bottom) ||
            (mid.x >= left && mid.x <= right && mid.y >= top && mid.y <= bottom)
          ) {
            ids.push(wall.id);
          }
        }
      }
    }
    return ids;
  }
}
