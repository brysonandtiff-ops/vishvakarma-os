/// <reference path="../../three.d.ts" />
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SSAOEffect,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';
import type { AtmospherePerformanceMode } from '@/utils/atmosphereMode';

export const POST_FX_WALL_CAP = 120;

export function isPostFxPipelineActive(
  mode: AtmospherePerformanceMode,
  wallCount: number,
  enabled = true,
): boolean {
  return enabled && mode === 'cinematic' && wallCount <= POST_FX_WALL_CAP;
}

export function isBloomActive(mode: AtmospherePerformanceMode, wallCount: number, enabled = true): boolean {
  return isPostFxPipelineActive(mode, wallCount, enabled);
}

/** @deprecated Use isBloomActive */
export function isBloomPipelineActive(enabled: boolean, wallCount: number): boolean {
  return enabled && wallCount <= POST_FX_WALL_CAP;
}

function PostFxPipeline({ mode }: { mode: AtmospherePerformanceMode }) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    instance.addPass(new RenderPass(scene, camera));

    // Lumen-lite Global Illumination (InitializeForge)
    const ssao = new SSAOEffect(camera, undefined, {
      intensity: 1.8,
      radius: 0.22,
      bias: 0.035,
      samples: 11,
      luminanceInfluence: 0.6,
    });
    instance.addPass(new EffectPass(camera, ssao));

    const bloom = new BloomEffect({
      intensity: 0.42,
      luminanceThreshold: 0.84,
      luminanceSmoothing: 0.88,
      mipmapBlur: false,
    });

    const toneMap =
      mode === 'cinematic'
        ? new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
        : new ToneMappingEffect({ mode: ToneMappingMode.REINHARD });

    instance.addPass(new EffectPass(camera, bloom, toneMap));
    return instance;
  }, [camera, gl, mode, scene]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}

export function ScenePostProcessing({
  mode,
  wallCount,
  enabled = true,
}: {
  mode: AtmospherePerformanceMode;
  wallCount: number;
  enabled?: boolean;
}) {
  if (!isPostFxPipelineActive(mode, wallCount, enabled)) return null;
  return <PostFxPipeline mode={mode} />;
}

/** Back-compat wrapper — prefer ScenePostProcessing */
export function CinematicBloom({ enabled, wallCount }: { enabled: boolean; wallCount: number }) {
  if (!isBloomPipelineActive(enabled, wallCount)) return null;
  return <PostFxPipeline mode="cinematic" />;
}
