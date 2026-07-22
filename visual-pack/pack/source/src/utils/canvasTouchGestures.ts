import { computePinchZoomFactor } from '@/utils/canvasViewportZoom';

export type ClientPoint = { x: number; y: number };

export type TrackedPointer = ClientPoint & {
  pointerId: number;
  pointerType: string;
};

export function pointerPairDistance(a: ClientPoint, b: ClientPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function computeClientCentroid(points: ClientPoint[]): ClientPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function shouldEnterTouchGesture(pointers: TrackedPointer[]): boolean {
  return pointers.filter((pointer) => pointer.pointerType === 'touch').length >= 2;
}

export function shouldRejectPalmTouch(pointers: TrackedPointer[], incomingPointerType: string): boolean {
  if (incomingPointerType !== 'touch') return false;
  return pointers.some((pointer) => pointer.pointerType === 'pen');
}

export type PinchGestureDelta = {
  panClientDeltaX: number;
  panClientDeltaY: number;
  scaleFactor: number;
};

export function computePinchGestureDelta(
  prevCentroid: ClientPoint,
  nextCentroid: ClientPoint,
  prevDistance: number,
  nextDistance: number,
): PinchGestureDelta {
  return {
    panClientDeltaX: nextCentroid.x - prevCentroid.x,
    panClientDeltaY: nextCentroid.y - prevCentroid.y,
    scaleFactor: computePinchZoomFactor(prevDistance, nextDistance),
  };
}

export class ActivePointerTracker {
  private pointers = new Map<number, TrackedPointer>();

  set(pointerId: number, pointer: TrackedPointer): void {
    this.pointers.set(pointerId, pointer);
  }

  delete(pointerId: number): void {
    this.pointers.delete(pointerId);
  }

  clear(): void {
    this.pointers.clear();
  }

  size(): number {
    return this.pointers.size;
  }

  values(): TrackedPointer[] {
    return [...this.pointers.values()];
  }

  touchPointers(): TrackedPointer[] {
    return this.values().filter((pointer) => pointer.pointerType === 'touch');
  }

  hasActivePen(): boolean {
    return this.values().some((pointer) => pointer.pointerType === 'pen');
  }

  shouldRejectIncoming(incomingPointerType: string): boolean {
    return shouldRejectPalmTouch(this.values(), incomingPointerType);
  }

  shouldEnterTouchGesture(): boolean {
    return shouldEnterTouchGesture(this.values());
  }
}
