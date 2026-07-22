/// <reference path="../../three.d.ts" />
import { Clone, useGLTF } from '@react-three/drei';
import { Component, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import {
  computeFootprintScale,
  getAllSceneModelUrls,
  getModelScaleTuning,
  type SceneModelCategory,
} from '@/core/sceneModelCatalog';

function enableShadows(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
}

export class GltfErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }

  componentDidCatch() {
    this.setState({ failed: true });
  }
}

export function preloadSceneModels() {
  for (const url of getAllSceneModelUrls()) {
    useGLTF.preload(url);
  }
}

function ScaledGltfScene({
  url,
  targetWidthM,
  targetDepthM,
  modelScale = 1,
  category,
  type,
}: {
  url: string;
  targetWidthM: number;
  targetDepthM: number;
  modelScale?: number;
  category: SceneModelCategory;
  type: string;
}) {
  const { scene } = useGLTF(url);

  const { clone, finalScale, positionY } = useMemo(() => {
    const cloned = scene.clone(true);
    enableShadows(cloned);
    cloned.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const fit = computeFootprintScale(
      { x: size.x, y: size.y, z: size.z },
      targetWidthM,
      targetDepthM,
      box.min.y,
    );
    const tuning = getModelScaleTuning(category, type);
    const scale = fit.scale * tuning * modelScale;
    return {
      clone: cloned,
      finalScale: scale,
      positionY: -box.min.y * scale,
    };
  }, [scene, targetWidthM, targetDepthM, modelScale, category, type]);

  return (
    <Clone object={clone} scale={finalScale} position={[0, positionY, 0]} />
  );
}

export function GltfModelBody({
  url,
  targetWidthM,
  targetDepthM,
  modelScale,
  category,
  type,
  fallback,
}: {
  url: string;
  targetWidthM: number;
  targetDepthM: number;
  modelScale?: number;
  category: SceneModelCategory;
  type: string;
  fallback: ReactNode;
}) {
  return (
    <GltfErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ScaledGltfScene
          url={url}
          targetWidthM={targetWidthM}
          targetDepthM={targetDepthM}
          modelScale={modelScale}
          category={category}
          type={type}
        />
      </Suspense>
    </GltfErrorBoundary>
  );
}
