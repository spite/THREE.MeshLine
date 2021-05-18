import * as THREE from 'three';

export class MeshLine extends THREE.BufferGeometry {
  constructor();
  geometry: MeshLine;
  points: Float32Array | Array<number>;
  isMeshLine: boolean;

  setPoints(points: Float32Array | Array<number>, wcb?: (p: number) => any): void;
  setMatrixWorld(matrixWorld: THREE.Matrix4): void;
  setGeometry(g: THREE.BufferGeometry, c: (p: number) => any): void;
  raycast: (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void;
  compareV3(a: number, b: number): number;
  copyV3(a: number): [number, number, number];
}

export class MeshLineMaterial extends THREE.ShaderMaterial {
  constructor(parameters?: {
    lineWidth?: number,
    map?: THREE.Texture,
    useMap?: number,
    alphaMap?: THREE.Texture,
    useAlphaMap?: number,
    color?: string | THREE.Color | number,
    opacity?: number,
    resolution: THREE.Vector2, // required
    sizeAttenuation?: number,
    dashArray?: number,
    dashOffset?: number,
    dashRatio?: number,
    useDash?: number,
    visibility?: number,
    alphaTest?: number,
    repeat?: THREE.Vector2,
  });

  lineWidth: number;
  map: THREE.Texture;
  useMap: number;
  alphaMap: THREE.Texture;
  useAlphaMap: number;
  color: THREE.Color | string | number;
  opacity: number;
  resolution: THREE.Vector2;
  sizeAttenuation: number;
  dashArray: number;
  dashOffset: number;
  dashRatio: number;
  useDesh: number;
  visibility: number;
  alphaTest: number;
  repeat: THREE.Vector2;
}

export function MeshLineRaycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void;
