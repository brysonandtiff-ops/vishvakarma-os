import { describe, expect, it } from 'vitest';
import { shouldBatchWalls } from '@/components/editor/sceneWallBatch';
import { isPostFxPipelineActive, POST_FX_WALL_CAP } from '@/components/editor/ScenePostProcessing';

describe('Viewport3D FPS stability wiring', () => {
  it('batches wall geometry across every atmosphere tier once the scene is non-trivial', () => {
    expect(shouldBatchWalls(9, 'standard')).toBe(false);
    expect(shouldBatchWalls(10, 'standard')).toBe(true);
    expect(shouldBatchWalls(10, 'premium')).toBe(true);
    expect(shouldBatchWalls(10, 'cinematic')).toBe(true);
    expect(shouldBatchWalls(80, 'cinematic')).toBe(true);
  });

  it('keeps post-processing limited to small cinematic scenes only', () => {
    expect(isPostFxPipelineActive('standard', 1)).toBe(false);
    expect(isPostFxPipelineActive('premium', 1)).toBe(false);
    expect(isPostFxPipelineActive('cinematic', POST_FX_WALL_CAP)).toBe(true);
    expect(isPostFxPipelineActive('cinematic', POST_FX_WALL_CAP + 1)).toBe(false);
    expect(isPostFxPipelineActive('cinematic', 1, false)).toBe(false);
  });
});
