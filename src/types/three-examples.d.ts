declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Group } from "three";
  export class GLTF {
    scene: Group;
    animations: any[];
  }
  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (ev: ProgressEvent) => void,
      onError?: (err: ErrorEvent | Error) => void
    ): void;
  }
  export default GLTFLoader;
}

declare module "three/examples/jsm/loaders/STLLoader" {
  import { BufferGeometry, LoadingManager } from "three";
  export class STLLoader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (geometry: BufferGeometry) => void,
      onProgress?: (ev: ProgressEvent) => void,
      onError?: (err: ErrorEvent | Error) => void
    ): void;
    setPath(path: string): this;
    parse(data: ArrayBuffer | string): BufferGeometry;
  }
  export default STLLoader;
}

declare module "three/examples/jsm/controls/OrbitControls" {
  import { Camera, EventDispatcher, MOUSE, TOUCH } from "three";
  export class OrbitControls extends EventDispatcher {
    enabled: boolean;
    constructor(object: Camera, domElement?: HTMLElement);
    target: import("three").Vector3;
    update(): void;
    dispose(): void;
    enableDamping: boolean;
    dampingFactor: number;
    screenSpacePanning: boolean;
    mouseButtons: Partial<Record<MOUSE, number>>;
    touches: Partial<Record<TOUCH, number>>;
  }
  export default OrbitControls;
}
