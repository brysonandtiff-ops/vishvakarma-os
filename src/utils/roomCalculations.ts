// Room Statistics Calculator
import type { Wall } from '@/types';

export interface RoomStats {
  area: number; // in square pixels
  perimeter: number; // in pixels
  wallCount: number;
  isEnclosed: boolean;
}

/**
 * Calculate room statistics from walls
 * Uses polygon area calculation for enclosed spaces
 */
export function calculateRoomStats(walls: Wall[]): RoomStats {
  if (walls.length === 0) {
    return {
      area: 0,
      perimeter: 0,
      wallCount: 0,
      isEnclosed: false,
    };
  }

  // Calculate perimeter
  const perimeter = walls.reduce((sum, wall) => {
    const length = Math.sqrt(
      Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
    );
    return sum + length;
  }, 0);

  // Check if walls form an enclosed space
  const endpoints = walls.flatMap((wall) => [
    { x: wall.start.x, y: wall.start.y },
    { x: wall.end.x, y: wall.end.y },
  ]);

  // Count connections at each endpoint
  const connectionCounts = new Map<string, number>();
  endpoints.forEach((point) => {
    const key = `${Math.round(point.x)},${Math.round(point.y)}`;
    connectionCounts.set(key, (connectionCounts.get(key) || 0) + 1);
  });

  // Enclosed if all endpoints have exactly 2 connections
  const isEnclosed = Array.from(connectionCounts.values()).every((count) => count === 2);

  // Calculate area using shoelace formula if enclosed
  let area = 0;
  if (isEnclosed && walls.length >= 3) {
    // Extract unique vertices in order
    const vertices: { x: number; y: number }[] = [];
    const visited = new Set<string>();

    let currentPoint = walls[0].start;
    vertices.push(currentPoint);
    visited.add(`${Math.round(currentPoint.x)},${Math.round(currentPoint.y)}`);

    // Traverse walls to build ordered vertex list
    for (let i = 0; i < walls.length; i++) {
      const nextWall = walls.find((wall) => {
        const startKey = `${Math.round(wall.start.x)},${Math.round(wall.start.y)}`;
        const endKey = `${Math.round(wall.end.x)},${Math.round(wall.end.y)}`;
        const currentKey = `${Math.round(currentPoint.x)},${Math.round(currentPoint.y)}`;

        if (startKey === currentKey && !visited.has(endKey)) {
          return true;
        }
        if (endKey === currentKey && !visited.has(startKey)) {
          return true;
        }
        return false;
      });

      if (!nextWall) break;

      const startKey = `${Math.round(nextWall.start.x)},${Math.round(nextWall.start.y)}`;
      const endKey = `${Math.round(nextWall.end.x)},${Math.round(nextWall.end.y)}`;
      const currentKey = `${Math.round(currentPoint.x)},${Math.round(currentPoint.y)}`;

      if (startKey === currentKey) {
        currentPoint = nextWall.end;
        vertices.push(currentPoint);
        visited.add(endKey);
      } else {
        currentPoint = nextWall.start;
        vertices.push(currentPoint);
        visited.add(startKey);
      }
    }

    // Shoelace formula
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    area = Math.abs(area) / 2;
  }

  return {
    area,
    perimeter,
    wallCount: walls.length,
    isEnclosed,
  };
}

/**
 * Calculate centroid of a room (center point)
 */
export function calculateRoomCentroid(walls: Wall[]): { x: number; y: number } | null {
  if (walls.length === 0) return null;

  const points = walls.flatMap((wall) => [wall.start, wall.end]);
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * Convert pixels to real-world units
 * Assuming 1 grid unit (20px) = 1 meter
 */
export function pixelsToMeters(pixels: number): number {
  return pixels / 20;
}

export function squarePixelsToSquareMeters(squarePixels: number): number {
  return squarePixels / (20 * 20);
}
