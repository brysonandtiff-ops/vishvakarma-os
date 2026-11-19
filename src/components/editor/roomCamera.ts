import { canvasToWorld, computeSceneOrigin, type SceneOrigin } from '@/core/sceneVisualCatalog';
import { pointToLineDistance } from '@/components/editor/blueprintCanvasDrawing';
import type { Point2D, Room, Wall } from '@/types';
import { getCachedRoomFaces, pointInPolygon, polygonCentroid } from '@/utils/roomCalculations';

type Position = [number, number, number];

export interface RoomCameraPose {
  position: Position;
  target: Position;
}

export function roomOrbitPose(walls: Wall[], origin: SceneOrigin, height: number, aspect: number): RoomCameraPose {
  let radius = 3;
  const targetHeight = Math.max(1, height / 2);
  for (const wall of walls) {
    for (const endpoint of [wall.start, wall.end]) {
      const { x, z } = canvasToWorld(endpoint, origin);
      radius = Math.max(radius, Math.hypot(x, z, targetHeight));
    }
  }
  // The existing perspective camera uses a 50° vertical field of view.
  const verticalHalfFov = 25 * Math.PI / 180;
  const halfFov = Math.atan(Math.tan(verticalHalfFov) * Math.min(1, Math.max(0.25, aspect)));
  const distance = radius / Math.sin(halfFov) * 1.12;
  const horizontal = distance * 0.55;
  return {
    position: [horizontal, targetHeight + distance * Math.sqrt(1 - 2 * 0.55 ** 2), horizontal],
    target: [0, targetHeight, 0],
  };
}

export function roomWalkPose(walls: Wall[], rooms: Room[], origin: SceneOrigin, elevation: number): RoomCameraPose {
  const floorCenter = walls.length > 0 ? computeSceneOrigin(walls) : origin;
  const hasClearance = (point: Point2D) => walls.every((wall) => (
    pointToLineDistance(point, wall.start, wall.end) > wall.thickness / 2 + 20
  ));
  let center = rooms.find((room) => room.center && hasClearance(room.center))?.center;
  if (!center) {
    for (const face of getCachedRoomFaces(walls)) {
      const centroid = polygonCentroid(face.vertices);
      if (!centroid) continue;
      const candidates = [centroid, ...face.vertices.map((vertex) => ({
        x: (centroid.x + vertex.x) / 2,
        y: (centroid.y + vertex.y) / 2,
      }))];
      center = candidates.find((point) => pointInPolygon(point, face.vertices) && hasClearance(point));
      if (center) break;
    }
  }
  center ??= { x: floorCenter.cx, y: floorCenter.cy };
  const { x, z } = canvasToWorld(center, origin);
  const eyeHeight = elevation + 1.6;
  const { x: floorX, z: floorZ } = canvasToWorld({ x: floorCenter.cx, y: floorCenter.cy }, origin);
  const target: Position = Math.hypot(x - floorX, z - floorZ) > 0.1
    ? [floorX, eyeHeight, floorZ]
    : [x, eyeHeight, z - 1];
  return { position: [x, eyeHeight, z], target };
}
