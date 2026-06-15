/// <reference path="../three.d.ts" />
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

const BLOOM_WALL_CAP = 200;

export function CinematicBloom({ enabled, wallCount }: { enabled: boolean; wallCount: number }) {
  const { gl, scene, camera, size } = useThree();
  const bloomEnabled = enabled && wallCount <= BLOOM_WALL_CAP;

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    instance.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      intensity: 0.5,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    });
    instance.addPass(new EffectPass(camera, bloom));
    return instance;
  }, [camera, gl, scene]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);

  useFrame(() => {
    if (!bloomEnabled) return;
    composer.render();
  }, 1);

  return null;
}
