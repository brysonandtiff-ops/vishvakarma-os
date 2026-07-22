import { describe, expect, it } from 'vitest';
import {
  ActivePointerTracker,
  computeClientCentroid,
  computePinchGestureDelta,
  pointerPairDistance,
  shouldEnterTouchGesture,
  shouldRejectPalmTouch,
} from '@/utils/canvasTouchGestures';

describe('canvasTouchGestures', () => {
  it('computes centroid of two client points', () => {
    const centroid = computeClientCentroid([{ x: 0, y: 0 }, { x: 100, y: 200 }]);
    expect(centroid).toEqual({ x: 50, y: 100 });
  });

  it('enters touch gesture only with two touch pointers', () => {
    expect(
      shouldEnterTouchGesture([
        { pointerId: 1, pointerType: 'touch', x: 0, y: 0 },
        { pointerId: 2, pointerType: 'touch', x: 10, y: 10 },
      ]),
    ).toBe(true);
    expect(
      shouldEnterTouchGesture([
        { pointerId: 1, pointerType: 'touch', x: 0, y: 0 },
        { pointerId: 2, pointerType: 'pen', x: 10, y: 10 },
      ]),
    ).toBe(false);
  });

  it('rejects palm touch when pen is active', () => {
    expect(
      shouldRejectPalmTouch([{ pointerId: 1, pointerType: 'pen', x: 0, y: 0 }], 'touch'),
    ).toBe(true);
    expect(
      shouldRejectPalmTouch([{ pointerId: 1, pointerType: 'mouse', x: 0, y: 0 }], 'touch'),
    ).toBe(false);
  });

  it('computes pinch pan delta and scale factor', () => {
    const delta = computePinchGestureDelta(
      { x: 100, y: 100 },
      { x: 120, y: 110 },
      100,
      150,
    );
    expect(delta.panClientDeltaX).toBe(20);
    expect(delta.panClientDeltaY).toBe(10);
    expect(delta.scaleFactor).toBe(1.5);
  });

  it('tracks active pointers and palm rejection', () => {
    const tracker = new ActivePointerTracker();
    tracker.set(1, { pointerId: 1, pointerType: 'pen', x: 5, y: 5 });
    expect(tracker.hasActivePen()).toBe(true);
    expect(tracker.shouldRejectIncoming('touch')).toBe(true);
    tracker.set(2, { pointerId: 2, pointerType: 'touch', x: 10, y: 10 });
    expect(tracker.shouldEnterTouchGesture()).toBe(false);
    tracker.delete(1);
    tracker.set(3, { pointerId: 3, pointerType: 'touch', x: 20, y: 20 });
    expect(tracker.shouldEnterTouchGesture()).toBe(true);
  });

  it('computes pointer pair distance', () => {
    expect(pointerPairDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
