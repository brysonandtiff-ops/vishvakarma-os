import { describe, expect, it } from 'vitest';
import { roomOrbitPose, roomWalkPose } from '@/components/editor/roomCamera';
import { pointToLineDistance } from '@/components/editor/blueprintCanvasDrawing';
import { buildDualKey3242Template } from '@/core/premiumTemplates';
import { computeSceneOrigin } from '@/core/sceneVisualCatalog';
import type { Wall } from '@/types';

const origin = { cx: 2000, cy: 800 };
const walls: Wall[] = [{ id: 'wall', start: { x: 0, y: 800 }, end: { x: 4000, y: 800 }, height: 280, thickness: 20 }];

function distance(a: [number, number, number], b: [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe('3D Room camera', () => {
  it('moves the Orbit camera back enough to fit a wide plan in a portrait viewport', () => {
    const desktop = roomOrbitPose(walls, origin, 2.8, 1.5);
    const phone = roomOrbitPose(walls, origin, 2.8, 0.7);
    expect(phone.target).toEqual([0, 1.4, 0]);
    expect(distance(phone.position, phone.target)).toBeGreaterThan(distance(desktop.position, desktop.target));
    expect(distance(desktop.position, desktop.target)).toBeGreaterThan(40);
  });

  it('walks from a room center at eye level on the active floor', () => {
    const room = { id: 'first-room', name: 'Living', wallIds: [], center: { x: 1600, y: 1000 } };
    const pose = roomWalkPose(walls, [room], origin, 3.2);
    expect(pose.position.slice(0, 1)).toEqual([-4]);
    expect(pose.position[1]).toBeCloseTo(4.8);
    expect(pose.position[2]).toBe(2);
    expect(pose.target).toEqual([0, pose.position[1], 0]);
    expect(roomWalkPose([], [], origin, 0)).toEqual({ position: [0, 1.6, 0], target: [0, 1.6, -1] });
  });

  it('finds an enclosed start for the Dual-Key sample without an authored room center', () => {
    const sample = buildDualKey3242Template();
    const sampleOrigin = computeSceneOrigin(sample.walls);
    const pose = roomWalkPose(sample.walls, [], sampleOrigin, 0);
    const startX = pose.position[0] * 100 + sampleOrigin.cx;
    const startY = pose.position[2] * 100 + sampleOrigin.cy;
    expect(startX).toBeGreaterThan(120);
    expect(startX).toBeLessThan(540);
    expect(startY).toBeGreaterThan(150);
    expect(startY).toBeLessThan(510);
    for (const wall of sample.walls) {
      expect(pointToLineDistance({ x: startX, y: startY }, wall.start, wall.end)).toBeGreaterThan(wall.thickness / 2 + 20);
    }
  });
});
