import { describe, it, expect } from 'vitest';
import {
  calculateRoomStats,
  calculateRoomCentroid,
  detectRoomAtPoint,
  findAllRoomFaces,
  pixelsToMeters,
  squarePixelsToSquareMeters,
} from '../utils/roomCalculations';
import type { Wall } from '../types';

function rectangleWalls(
  x: number,
  y: number,
  width: number,
  height: number,
  prefix = 'w',
): Wall[] {
  return [
    { id: `${prefix}1`, start: { x, y }, end: { x: x + width, y }, thickness: 10, height: 300 },
    { id: `${prefix}2`, start: { x: x + width, y }, end: { x: x + width, y: y + height }, thickness: 10, height: 300 },
    { id: `${prefix}3`, start: { x: x + width, y: y + height }, end: { x, y: y + height }, thickness: 10, height: 300 },
    { id: `${prefix}4`, start: { x, y: y + height }, end: { x, y }, thickness: 10, height: 300 },
  ];
}

describe('roomCalculations', () => {
  describe('pixelsToMeters', () => {
    it('should convert pixels to meters (20px = 1 meter)', () => {
      expect(pixelsToMeters(20)).toBe(1);
      expect(pixelsToMeters(40)).toBe(2);
      expect(pixelsToMeters(10)).toBe(0.5);
      expect(pixelsToMeters(0)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(pixelsToMeters(30)).toBe(1.5);
      expect(pixelsToMeters(15)).toBe(0.75);
    });
  });

  describe('squarePixelsToSquareMeters', () => {
    it('should convert square pixels to square meters', () => {
      expect(squarePixelsToSquareMeters(400)).toBe(1); // 20x20 pixels = 1x1 meters
      expect(squarePixelsToSquareMeters(1600)).toBe(4); // 40x40 pixels = 2x2 meters
      expect(squarePixelsToSquareMeters(0)).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(squarePixelsToSquareMeters(900)).toBe(2.25); // 30x30 pixels = 1.5x1.5 meters
    });
  });

  describe('calculateRoomStats', () => {
    it('should calculate perimeter for a simple rectangle', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 400, y: 0 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w2',
          start: { x: 400, y: 0 },
          end: { x: 400, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w3',
          start: { x: 400, y: 300 },
          end: { x: 0, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w4',
          start: { x: 0, y: 300 },
          end: { x: 0, y: 0 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.wallCount).toBe(4);
      expect(stats.perimeter).toBe(1400); // 400 + 300 + 400 + 300
      expect(stats.isEnclosed).toBe(true);
    });

    it('should calculate area using Shoelace formula for enclosed rectangle', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 400, y: 0 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w2',
          start: { x: 400, y: 0 },
          end: { x: 400, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w3',
          start: { x: 400, y: 300 },
          end: { x: 0, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w4',
          start: { x: 0, y: 300 },
          end: { x: 0, y: 0 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.area).toBe(120000); // 400 * 300 = 120,000 square pixels
      expect(stats.isEnclosed).toBe(true);
    });

    it('should return 0 area for non-enclosed spaces', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 400, y: 0 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w2',
          start: { x: 400, y: 0 },
          end: { x: 400, y: 300 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.area).toBe(0);
      expect(stats.isEnclosed).toBe(false);
      expect(stats.wallCount).toBe(2);
    });

    it('should handle empty wall array', () => {
      const stats = calculateRoomStats([]);
      
      expect(stats.wallCount).toBe(0);
      expect(stats.perimeter).toBe(0);
      expect(stats.area).toBe(0);
      expect(stats.isEnclosed).toBe(false);
    });

    it('should handle single wall', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 400, y: 0 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.wallCount).toBe(1);
      expect(stats.perimeter).toBe(400);
      expect(stats.area).toBe(0);
      expect(stats.isEnclosed).toBe(false);
    });

    it('should calculate area for L-shaped room', () => {
      const walls: Wall[] = [
        { id: 'w1', start: { x: 0, y: 0 }, end: { x: 300, y: 0 }, thickness: 10, height: 300 },
        { id: 'w2', start: { x: 300, y: 0 }, end: { x: 300, y: 200 }, thickness: 10, height: 300 },
        { id: 'w3', start: { x: 300, y: 200 }, end: { x: 200, y: 200 }, thickness: 10, height: 300 },
        { id: 'w4', start: { x: 200, y: 200 }, end: { x: 200, y: 300 }, thickness: 10, height: 300 },
        { id: 'w5', start: { x: 200, y: 300 }, end: { x: 0, y: 300 }, thickness: 10, height: 300 },
        { id: 'w6', start: { x: 0, y: 300 }, end: { x: 0, y: 0 }, thickness: 10, height: 300 },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.isEnclosed).toBe(true);
      expect(stats.wallCount).toBe(6);
      // L-shape: 300x200 + 200x100 = 60000 + 20000 = 80000
      expect(stats.area).toBeGreaterThan(0);
    });
  });

  describe('calculateRoomCentroid', () => {
    it('should calculate centroid for a rectangle', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 400, y: 0 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w2',
          start: { x: 400, y: 0 },
          end: { x: 400, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w3',
          start: { x: 400, y: 300 },
          end: { x: 0, y: 300 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w4',
          start: { x: 0, y: 300 },
          end: { x: 0, y: 0 },
          thickness: 10,
          height: 300,
        },
      ];

      const centroid = calculateRoomCentroid(walls);
      
      // Center of 400x300 rectangle should be at (200, 150)
      expect(centroid.x).toBe(200);
      expect(centroid.y).toBe(150);
    });

    it('should return (0, 0) for empty wall array', () => {
      const centroid = calculateRoomCentroid([]);
      
      expect(centroid).toBeNull();
    });

    it('should calculate centroid for single wall', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 100, y: 100 },
          end: { x: 300, y: 100 },
          thickness: 10,
          height: 300,
        },
      ];

      const centroid = calculateRoomCentroid(walls);
      
      // Average of endpoints: ((100+300)/2, (100+100)/2) = (200, 100)
      expect(centroid).not.toBeNull();
      expect(centroid!.x).toBe(200);
      expect(centroid!.y).toBe(100);
    });

    it('should calculate centroid for triangle', () => {
      const walls: Wall[] = [
        { id: 'w1', start: { x: 0, y: 0 }, end: { x: 300, y: 0 }, thickness: 10, height: 300 },
        { id: 'w2', start: { x: 300, y: 0 }, end: { x: 150, y: 300 }, thickness: 10, height: 300 },
        { id: 'w3', start: { x: 150, y: 300 }, end: { x: 0, y: 0 }, thickness: 10, height: 300 },
      ];

      const centroid = calculateRoomCentroid(walls);
      
      // Centroid of triangle with vertices (0,0), (300,0), (150,300)
      // Should be approximately (150, 100)
      expect(centroid).not.toBeNull();
      expect(centroid!.x).toBeCloseTo(150, 0);
      expect(centroid!.y).toBeCloseTo(100, 0);
    });
  });

  describe('multi-room detection', () => {
    it('finds two adjacent rooms sharing an interior wall', () => {
      const left = rectangleWalls(0, 0, 200, 200, 'l');
      const sharedWall: Wall = {
        id: 'shared',
        start: { x: 200, y: 0 },
        end: { x: 200, y: 200 },
        thickness: 10,
        height: 300,
      };
      const right = rectangleWalls(200, 0, 200, 200, 'r').filter((w) => w.id !== 'r4');
      const walls = [...left, sharedWall, ...right];

      const faces = findAllRoomFaces(walls);
      expect(faces.length).toBeGreaterThanOrEqual(2);

      const leftRoom = detectRoomAtPoint(walls, { x: 100, y: 100 });
      const rightRoom = detectRoomAtPoint(walls, { x: 300, y: 100 });
      expect(leftRoom).not.toBeNull();
      expect(rightRoom).not.toBeNull();
      expect(leftRoom!.wallIds).not.toEqual(rightRoom!.wallIds);
      expect(leftRoom!.area).toBeGreaterThan(0);
      expect(rightRoom!.area).toBeGreaterThan(0);
    });

    it('detectRoomAtPoint picks the smallest containing cycle in nested layouts', () => {
      const outer = rectangleWalls(0, 0, 400, 400, 'o');
      const inner = rectangleWalls(100, 100, 100, 100, 'i');
      const walls = [...outer, ...inner];

      const innerRoom = detectRoomAtPoint(walls, { x: 150, y: 150 });
      expect(innerRoom).not.toBeNull();
      expect(innerRoom!.wallIds.every((id) => id.startsWith('i'))).toBe(true);

      const outerRoom = detectRoomAtPoint(walls, { x: 50, y: 50 });
      expect(outerRoom).not.toBeNull();
      expect(outerRoom!.wallIds.some((id) => id.startsWith('o'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle walls with zero length', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 100, y: 100 },
          end: { x: 100, y: 100 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.perimeter).toBe(0);
      expect(stats.area).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: -100, y: -100 },
          end: { x: 100, y: -100 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w2',
          start: { x: 100, y: -100 },
          end: { x: 100, y: 100 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w3',
          start: { x: 100, y: 100 },
          end: { x: -100, y: 100 },
          thickness: 10,
          height: 300,
        },
        {
          id: 'w4',
          start: { x: -100, y: 100 },
          end: { x: -100, y: -100 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.isEnclosed).toBe(true);
      expect(stats.area).toBeGreaterThan(0);
      
      const centroid = calculateRoomCentroid(walls);
      expect(centroid).not.toBeNull();
      expect(centroid!.x).toBe(0);
      expect(centroid!.y).toBe(0);
    });

    it('should handle very large coordinates', () => {
      const walls: Wall[] = [
        {
          id: 'w1',
          start: { x: 0, y: 0 },
          end: { x: 10000, y: 0 },
          thickness: 10,
          height: 300,
        },
      ];

      const stats = calculateRoomStats(walls);
      
      expect(stats.perimeter).toBe(10000);
      expect(pixelsToMeters(10000)).toBe(500); // 10000 / 20 = 500 meters
    });
  });
});
