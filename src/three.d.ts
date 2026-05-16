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
      group: any;
    }
  }
}

export {};
