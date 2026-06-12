declare module 'three' {
  export * from 'three';
}

declare module '@react-three/fiber' {
  export * from '@react-three/fiber';
}

declare module '@react-three/drei' {
  export * from '@react-three/drei';
}

// React Three Fiber JSX type declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      gridHelper: any;
      axesHelper: any;
      ringGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      bufferGeometry: any;
      bufferAttribute: any;
      points: any;
      pointsMaterial: any;
      meshPhysicalMaterial: any;
      fog: any;
      hemisphereLight: any;
      color: any;
      group: any;
    }
  }
}

export {};
