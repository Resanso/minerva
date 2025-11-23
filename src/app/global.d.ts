// Asset module declarations
declare module "*.glb";
declare module "*.gltf";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";

// meshline package (non-typed)
declare module "meshline" {
  export const MeshLineGeometry: any;
  export const MeshLineMaterial: any;
}

// Register custom three-fiber elements for MeshLine
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}
