import { describe, expect, it, vi } from 'vitest';
import {
  createCanvasRenderScheduler,
  createEmptyDirtyFlags,
} from '@/components/editor/blueprint/canvasRenderLoop';

describe('canvas render scheduler', () => {
  it('coalesces draw calls into a single animation frame', () => {
    const flags = createEmptyDirtyFlags();
    const draw = vi.fn();
    const scheduler = createCanvasRenderScheduler(
      draw,
      () => flags,
      () => {
        flags.geometry = false;
        flags.viewport = false;
        flags.interaction = false;
        flags.overlay = false;
      },
    );

    scheduler.requestDraw('geometry');
    scheduler.requestDraw('interaction');
    expect(draw).not.toHaveBeenCalled();
    scheduler.flush();
    expect(draw).toHaveBeenCalledTimes(1);
  });
});
