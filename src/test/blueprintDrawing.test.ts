import { describe, expect, it, vi } from 'vitest';
import type { Opening, Wall } from '@/types';
import { computeVisibleGridBounds } from '@/core/sceneDrawingTokens';
import {
  drawDoorSymbol,
  drawWindowSymbol,
  openingSpanOnWall,
} from '@/components/editor/blueprint/openingSymbols';
import { drawRoomLabels } from '@/components/editor/blueprint/drawRooms';

const sampleWall: Wall = {
  id: 'w1',
  start: { x: 0, y: 0 },
  end: { x: 400, y: 0 },
  thickness: 8,
};

const sampleDoor: Opening = {
  id: 'd1',
  type: 'door',
  wallId: 'w1',
  position: 0.5,
  width: 90,
  height: 210,
};

describe('blueprint drawing polish', () => {
  it('computes opening span with clamped parametric bounds', () => {
    const span = openingSpanOnWall(sampleWall, sampleDoor);
    expect(span).not.toBeNull();
    expect(span!.center).toEqual({ x: 200, y: 0 });
    expect(span!.halfWidthPx).toBe(45);
    expect(span!.startT).toBeGreaterThanOrEqual(0);
    expect(span!.endT).toBeLessThanOrEqual(1);
  });

  it('covers the viewport in world space at multiple zoom levels', () => {
    for (const zoom of [0.25, 1, 4]) {
      const bounds = computeVisibleGridBounds(1200, 800, { panX: 100, panY: 50, zoom });
      expect(bounds.width).toBeCloseTo(1200 / zoom);
      expect(bounds.height).toBeCloseTo(800 / zoom);
      expect(bounds.left).toBeCloseTo(-100 / zoom);
      expect(bounds.top).toBeCloseTo(-50 / zoom);
    }
  });

  it('draws door and window symbols without throwing on a mock context', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;

    expect(() => drawDoorSymbol(ctx, sampleWall, sampleDoor, { highlighted: true })).not.toThrow();
    expect(() => drawWindowSymbol(ctx, sampleWall, { ...sampleDoor, type: 'window' }, {})).not.toThrow();
  });

  it('centers room label chips', () => {
    let textAlign = '';
    let textBaseline = '';
    const ctx = {
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      measureText: (text: string) => ({ width: text.length * 8 }),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      set textAlign(value: string) {
        textAlign = value;
      },
      get textAlign() {
        return textAlign;
      },
      set textBaseline(value: string) {
        textBaseline = value;
      },
      get textBaseline() {
        return textBaseline;
      },
    } as unknown as CanvasRenderingContext2D;

    drawRoomLabels(ctx, [{
      id: 'r1',
      name: 'Kitchen',
      area: 12.4,
      center: { x: 100, y: 100 },
      wallIds: [],
    }]);

    expect(textAlign).toBe('center');
    expect(textBaseline).toBe('middle');
  });
});
