import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyGeometryVertexColor,
  ROOM_BATCH_THRESHOLD,
  shouldBatchRooms,
} from '@/components/editor/sceneRoomBatch';

describe('sceneRoomBatch', () => {
  it('shouldBatchRooms batches at threshold for non-cinematic tiers', () => {
    expect(shouldBatchRooms(ROOM_BATCH_THRESHOLD - 1, 'standard')).toBe(false);
    expect(shouldBatchRooms(ROOM_BATCH_THRESHOLD, 'standard')).toBe(true);
    expect(shouldBatchRooms(ROOM_BATCH_THRESHOLD, 'premium')).toBe(true);
    expect(shouldBatchRooms(ROOM_BATCH_THRESHOLD, 'cinematic')).toBe(false);
  });

  it('applyGeometryVertexColor paints every vertex', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    applyGeometryVertexColor(geometry, '#ff8800');

    const colors = geometry.getAttribute('color');
    expect(colors).toBeDefined();
    expect(colors.count).toBe(geometry.attributes.position.count);
    expect(colors.getX(0)).toBeCloseTo(new THREE.Color('#ff8800').r, 5);
    geometry.dispose();
  });
});
