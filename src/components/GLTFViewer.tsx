"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  createFadeInMoveRightAnimation,
  ModelAnimation,
} from "./modelAnimations";
import { createViewerControls, ViewerControlsAPI } from "./ViewerControls";
import { mountModelModal, unmountModelModal } from "./ModelModal";

type ModelItem = {
  id: string; // unique identifier for the model
  src: string; // path to the glb
  position?: [number, number, number];
  rotation?: [number, number, number]; // Euler in radians
  scale?: number;
};

type Props = {
  // either provide legacy single `src` or an array of models
  src?: string;
  models?: ModelItem[];
  className?: string;
  style?: CSSProperties;
  // optional global texture applied to meshes (public path)
  textureUrl?: string;
  // optional URL (under public/) to load a JSON array of ModelItem to configure models/positions
  configUrl?: string;
};

export default function GLTFViewer({
  src = "/3d-model/furnace.glb",
  models,
  className,
  style,
  textureUrl = "",
  configUrl = "/3d-model/models.json",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [droneMode, setDroneMode] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth /
        Math.max(container.clientHeight, window.innerHeight || 600),
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3);
    const cameraRef = {
      current: camera,
    } as { current: THREE.PerspectiveCamera | null };

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      container.clientWidth,
      container.clientHeight || window.innerHeight || 480
    );
    // enable shadows for a more realistic floor contact
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
      (THREE as any).PCFSoftShadowMap || THREE.PCFSoftShadowMap;
    // ensure correct color space so sRGB textures display properly
    (renderer as any).outputEncoding = (THREE as any).sRGBEncoding;
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(3, 10, 10);
    dir.castShadow = true;
    // configure shadow camera for directional light
    try {
      dir.shadow.mapSize.width = 2048;
      dir.shadow.mapSize.height = 2048;
      const d = 30;
      (dir.shadow.camera as any).left = -d;
      (dir.shadow.camera as any).right = d;
      (dir.shadow.camera as any).top = d;
      (dir.shadow.camera as any).bottom = -d;
      (dir.shadow.camera as any).near = 0.5;
      (dir.shadow.camera as any).far = 200;
    } catch (e) {
      /* ignore if shadow camera properties not writable */
    }
    scene.add(dir);

    // add a ground plane and grid helper to define the map floor
    const floorSize = 200;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0; // floor at y=0
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const grid = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
    grid.position.y = 0.001; // avoid z-fighting with floor
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();
    const controlsRef = { current: controls } as { current: any };

    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();
    let modalMounted = false;
    let pendingModalId: string | null = null;

    const openModalForObject = (object: THREE.Object3D, meta: any = {}) => {
      try {
        const id = object.userData?.modelId || object.name || "(unknown)";
        const description = meta?.description ?? object.userData?.description;
        const snapshot = object.clone(true);
        if (modalMounted) {
          try {
            unmountModelModal();
          } catch (err) {
            console.error("Failed to unmount existing model modal", err);
          }
          modalMounted = false;
        }
        mountModelModal({
          id,
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          scale: object.scale.clone(),
          description,
          objectSnapshot: snapshot,
          onClose: () => {
            modalMounted = false;
          },
        });
        modalMounted = true;
        pendingModalId = null;
      } catch (err) {
        console.error("Failed to mount model modal", err);
      }
    };

    // track loaded objects, materials and textures for cleanup
    const objects = new Map<string, THREE.Object3D>();
    // custom per-model animation handlers (e.g. arrow left->right motion)
    const customAnimations = new Map<string, ModelAnimation>();
    const clonedMaterials: THREE.Material[] = [];
    const appliedTextures: THREE.Texture[] = [];
    // viewer controls (separate DOM panel) - provide deps for selection
    const controlsApi: ViewerControlsAPI = createViewerControls(container, {
      getObjects: () => Array.from(objects.values()),
      camera,
      domElement: renderer.domElement,
      onSelect: ({ object, meta }) => {
        openModalForObject(object, meta);
      },
      onDeselect: () => {
        if (!modalMounted) return;
        try {
          unmountModelModal();
        } catch (err) {
          console.error("Failed to unmount model modal", err);
        }
        modalMounted = false;
      },
    });

    const handleExternalOpen = (event: Event) => {
      try {
        const detail = (event as CustomEvent<{ id?: string }>).detail;
        const targetId = detail?.id;
        if (!targetId) return;
        const direct =
          objects.get(targetId) ??
          Array.from(objects.values()).find((obj) => {
            const modelId = String(obj.userData?.modelId || obj.name || "");
            return modelId.toLowerCase() === targetId.toLowerCase();
          });
        if (direct) {
          openModalForObject(direct);
          pendingModalId = null;
          return;
        }
        pendingModalId = targetId;
      } catch (err) {
        console.error("Failed processing external model modal request", err);
      }
    };

    window.addEventListener(
      "__openModelModal",
      handleExternalOpen as EventListener
    );

    // helper to apply a texture to a mesh and clone materials safely
    const applyTextureToMesh = (mesh: any, texture: THREE.Texture | null) => {
      const mat = mesh.material;
      if (!mat) return;
      if (Array.isArray(mat)) {
        const newMats = mat.map((m: any) => {
          try {
            const cloned = m.clone();
            if (texture && "map" in cloned) cloned.map = texture;
            cloned.needsUpdate = true;
            clonedMaterials.push(cloned);
            return cloned;
          } catch (e) {
            const mm = new THREE.MeshStandardMaterial({ map: texture || null });
            mm.needsUpdate = true;
            clonedMaterials.push(mm);
            return mm;
          }
        });
        mesh.material = newMats as any;
      } else {
        try {
          const cloned = mat.clone();
          if (texture && "map" in cloned) cloned.map = texture;
          cloned.needsUpdate = true;
          mesh.material = cloned;
          clonedMaterials.push(cloned);
        } catch (e) {
          const mm = new THREE.MeshStandardMaterial({ map: texture || null });
          mm.needsUpdate = true;
          mesh.material = mm;
          clonedMaterials.push(mm);
        }
      }
    };

    // load optional global texture (if provided)
    let globalTexture: THREE.Texture | null = null;
    if (textureUrl) {
      try {
        texLoader.load(
          textureUrl,
          (texture) => {
            (texture as any).encoding = (THREE as any).sRGBEncoding;
            texture.flipY = false;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            texture.generateMipmaps = true;
            texture.minFilter =
              (THREE as any).LinearMipmapLinearFilter ||
              THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            try {
              (texture as any).anisotropy = (renderer as any).capabilities
                ?.getMaxAnisotropy
                ? (renderer as any).capabilities.getMaxAnisotropy()
                : ((renderer as any).capabilities || {}).maxAnisotropy || 1;
            } catch (e) {
              /* ignore */
            }
            texture.needsUpdate = true;
            globalTexture = texture;
            appliedTextures.push(texture);
            // once texture is ready, (re)apply to all already loaded meshes
            for (const obj of objects.values()) {
              try {
                if (obj.userData && obj.userData.modelId === "arrow") continue;
              } catch (e) {}
              obj.traverse((child: any) => {
                if (child.isMesh) applyTextureToMesh(child, globalTexture);
              });
            }
          },
          undefined,
          () => {
            // ignore texture load errors
          }
        );
      } catch (e) {
        // ignore
      }
    }

    // helper to center+scale an object to a reasonable size
    const normalizeObject = (obj: THREE.Object3D, desiredSize = 1.5) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = desiredSize / maxDim;
        obj.scale.setScalar(scale);
      }
      const center = new THREE.Vector3();
      box.getCenter(center);
      obj.position.sub(center);
    };

    // load or update models when `models` prop changes. We also support legacy `src` prop as a single model.
    const getModelList = () => {
      if (models && models.length > 0) return models;
      // load all known models from public/3d-model and arrange in a grid
      const files = [
        "arrow.glb",
        "casting-machine.glb",
        "furnace.glb",
        "homogenizing.glb",
        "rod-feeder.glb",
        "sir.glb",
        "ut.glb",
      ];
      const cols = 4;
      const spacing = 2.0;
      return files.map((fname, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const offsetX = (col - (cols - 1) / 2) * spacing;
        const offsetZ =
          (row - (Math.ceil(files.length / cols) - 1) / 2) * spacing;
        const id = fname.replace(/\.glb$/i, "");
        return {
          id,
          src: `/3d-model/${fname}`,
          position: [offsetX, 0, offsetZ] as [number, number, number],
          scale: 1,
        } as ModelItem;
      });
    };

    // map to track model src used for an id to detect re-loads
    const updateModels = (items: ModelItem[]) => {
      const incomingIds = new Set(items.map((m) => m.id));

      // remove objects that are not in incoming list
      for (const [id, obj] of objects.entries()) {
        if (!incomingIds.has(id)) {
          scene.remove(obj);
          // dispose materials on meshes
          obj.traverse((child: any) => {
            if (child.isMesh) {
              try {
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(
                      (mm: any) => mm.dispose && mm.dispose()
                    );
                  } else child.material.dispose && child.material.dispose();
                }
              } catch (e) {
                // ignore
              }
            }
          });
          objects.delete(id);
        }
      }

      // add or update incoming models
      for (const m of items) {
        const existing = objects.get(m.id);
        if (existing) {
          // update transforms
          const [x = 0, y = 0, z = 0] = m.position || [0, 0, 0];
          existing.position.set(x, y, z);
          if (m.rotation)
            existing.rotation.set(m.rotation[0], m.rotation[1], m.rotation[2]);
          if (typeof m.scale === "number") existing.scale.setScalar(m.scale);
          continue;
        }

        // load new model
        loader.load(
          m.src,
          (gltf: any) => {
            const obj = gltf.scene;
            // apply texture to child meshes (if texture already loaded)
            obj.traverse((child: any) => {
              if (child.isMesh) {
                // ensure geometry has UVs; if not, create simple planar UVs
                const geom: THREE.BufferGeometry | undefined = child.geometry;
                if (geom) {
                  const posAttr = geom.getAttribute("position");
                  if (posAttr && !geom.getAttribute("uv")) {
                    if (!geom.boundingBox) geom.computeBoundingBox();
                    const bbox = geom.boundingBox!;
                    const size = new THREE.Vector3();
                    bbox.getSize(size);
                    const count = posAttr.count;
                    const uvArray = new Float32Array(count * 2);
                    for (let i = 0; i < count; i++) {
                      const x = posAttr.getX(i);
                      const y = posAttr.getY(i);
                      const u = (x - bbox.min.x) / (size.x || 1);
                      const v = (y - bbox.min.y) / (size.y || 1);
                      uvArray[i * 2] = u;
                      uvArray[i * 2 + 1] = v;
                    }
                    geom.setAttribute(
                      "uv",
                      new THREE.BufferAttribute(uvArray, 2)
                    );
                  }
                }
                // enable shadows for model meshes so they cast onto the floor
                try {
                  child.castShadow = true;
                  child.receiveShadow = true;
                } catch (e) {
                  /* ignore */
                }
              }
            });

            normalizeObject(obj, 1.5);

            // apply provided transforms
            const [x = 0, y = 0, z = 0] = m.position || [0, 0, 0];
            obj.position.set(x, y, z);
            // ensure the object's bottom is at or above the floor (y=0)
            try {
              const bbox = new THREE.Box3().setFromObject(obj);
              const minY = bbox.min.y;
              // if the object's min Y is below 0, lift it up so it rests on the floor
            } catch (e) {
              // ignore bbox errors
            }
            if (m.rotation) {
              try {
                // accept rotation as either radians or degrees (auto-detect)
                let rx = m.rotation[0] || 0;
                let ry = m.rotation[1] || 0;
                let rz = m.rotation[2] || 0;
                const limit = Math.PI * 2; // ~6.283
                const isLikelyDegrees =
                  Math.abs(rx) > limit ||
                  Math.abs(ry) > limit ||
                  Math.abs(rz) > limit;
                if (isLikelyDegrees) {
                  const toRad = (v: number) => (v * Math.PI) / 180;
                  rx = toRad(rx);
                  ry = toRad(ry);
                  rz = toRad(rz);
                }
                obj.rotation.set(rx, ry, rz);
              } catch (e) {
                /* ignore rotation errors */
              }
            }
            if (typeof m.scale === "number") obj.scale.setScalar(m.scale);

            scene.add(obj);
            objects.set(m.id, obj);
            // record model id and available animation clips for selection UI
            try {
              obj.userData = obj.userData || {};
              obj.userData.modelId = m.id;
              obj.userData.clips = (gltf.animations || []).map(
                (a: any) => a.name || ""
              );
            } catch (e) {
              /* ignore */
            }

            if (
              pendingModalId &&
              m.id &&
              m.id.toLowerCase() === pendingModalId.toLowerCase()
            ) {
              openModalForObject(obj);
              pendingModalId = null;
            }

            // apply per-model texture if configured, otherwise apply globalTexture (skip arrow)
            try {
              const modelCfg: any = m as any;
              if (modelCfg && modelCfg.texture) {
                // load per-model texture
                texLoader.load(
                  modelCfg.texture,
                  (t) => {
                    try {
                      (t as any).encoding = (THREE as any).sRGBEncoding;
                      t.flipY = false;
                      t.wrapS = t.wrapT = THREE.RepeatWrapping;
                      t.repeat.set(1, 1);
                      t.generateMipmaps = true;
                      t.minFilter =
                        (THREE as any).LinearMipmapLinearFilter ||
                        THREE.LinearMipmapLinearFilter;
                      t.magFilter = THREE.LinearFilter;
                      t.needsUpdate = true;
                      appliedTextures.push(t);
                      obj.traverse((child: any) => {
                        if (child.isMesh) applyTextureToMesh(child, t);
                      });
                    } catch (e) {
                      /* ignore */
                    }
                  },
                  undefined,
                  () => {
                    /* ignore per-model texture load errors */
                  }
                );
              } else if (globalTexture && m.id !== "arrow") {
                obj.traverse((child: any) => {
                  if (child.isMesh) applyTextureToMesh(child, globalTexture);
                });
              }
            } catch (e) {
              /* ignore */
            }
            // if this is the arrow model, set up a custom left-right animation so it sweeps across
            try {
              if (m.id === "arrow") {
                const baseX = obj.position.x || 0;
                const distance = (m as any).animationDistance || 1.6;
                const duration = (m as any).animationDuration || 1.4;
                const anim = createFadeInMoveRightAnimation(obj, {
                  baseX,
                  distance,
                  duration,
                });
                customAnimations.set(m.id, anim);
              }
            } catch (e) {
              /* ignore */
            }
          },
          undefined,
          (err: unknown) => {
            // eslint-disable-next-line no-console
            console.error("GLTF load error:", err);
          }
        );
      }
    };

    // initial load --- if `models` prop provided use it, else try to fetch configUrl then fallback to default grid
    (async () => {
      if (models && models.length > 0) {
        updateModels(getModelList());
        return;
      }
      try {
        const res = await fetch(configUrl, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as ModelItem[];
          if (Array.isArray(json) && json.length > 0) {
            updateModels(json);
            return;
          }
        }
      } catch (e) {
        // ignore fetch errors and fallback
      }
      updateModels(getModelList());
    })();

    // --- Drone camera support ---
    const movement = {
      forward: false,
      back: false,
      left: false,
      right: false,
      up: false,
      down: false,
    };
    const movementRef = { current: movement } as { current: typeof movement };
    const droneModeRef = { current: droneMode } as { current: boolean };
    let pointerLocked = false;
    // structured look state for clearer controls
    let isRightMouseDown = false;
    let lastMouse = { x: 0, y: 0 };
    const look = { yaw: camera.rotation.y, pitch: camera.rotation.x };
    const lookSens = 0.004; // sensitivity for right-drag look

    const onPointerLockChange = () => {
      pointerLocked = document.pointerLockElement === renderer.domElement;
      // if pointer unlocked, exit drone mode
      if (!pointerLocked) {
        droneModeRef.current = false;
        // notify React state via custom event
        window.dispatchEvent(
          new CustomEvent("__droneModeChanged", { detail: false })
        );
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const cam = cameraRef.current;
      if (!cam) return;
      // pointer lock mode: use movementX/movementY (continuous)
      if (pointerLocked) {
        const sens = 0.0025;
        look.pitch -= e.movementY * sens;
        look.yaw -= e.movementX * sens;
      } else if (isRightMouseDown) {
        // right-button drag look: use client coordinates and lastMouse
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        look.yaw -= dx * lookSens;
        look.pitch -= dy * lookSens;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
      } else {
        return;
      }
      // clamp pitch to avoid flip
      const piHalf = Math.PI / 2 - 0.01;
      look.pitch = Math.max(-piHalf, Math.min(piHalf, look.pitch));
      // apply rotation using YXZ order (yaw then pitch)
      cam.rotation.order = "YXZ" as any;
      cam.rotation.x = look.pitch;
      cam.rotation.y = look.yaw;
    };

    const onMouseDown = (e: MouseEvent) => {
      // right button (2) initiates drag-look
      if (e.button === 2) {
        isRightMouseDown = true;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
        // disable orbit while dragging
        try {
          controlsRef.current.enabled = false;
        } catch (err) {
          /* ignore */
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown = false;
        // re-enable orbit if not in drone mode
        try {
          controlsRef.current.enabled = !droneModeRef.current;
        } catch (err) {
          /* ignore */
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // support both event.code and event.key for broader compatibility
      const code = e.code;
      const key = e.key;
      const wasDrone = droneModeRef.current;
      // if drone mode is active, prevent default for movement keys so inputs don't capture them
      const preventWhenDrone = (shouldPrevent = true) => {
        if (wasDrone && shouldPrevent) e.preventDefault();
      };

      switch (code) {
        case "KeyW":
          movementRef.current.forward = true;
          preventWhenDrone();
          break;
        case "KeyS":
          movementRef.current.back = true;
          preventWhenDrone();
          break;
        case "KeyA":
          movementRef.current.left = true;
          preventWhenDrone();
          break;
        case "KeyD":
          movementRef.current.right = true;
          preventWhenDrone();
          break;
        case "Space":
          movementRef.current.up = true;
          preventWhenDrone();
          break;
        case "ShiftLeft":
        case "ShiftRight":
          movementRef.current.down = true;
          preventWhenDrone();
          break;
        case "KeyM":
          // toggle drone mode
          try {
            if (!droneModeRef.current) renderer.domElement.requestPointerLock();
          } catch (err) {
            /* ignore */
          }
          window.dispatchEvent(new CustomEvent("__toggleDroneMode"));
          break;
        default:
          // fallback checks using key (some browsers use key instead of code)
          if (key === "Shift") {
            movementRef.current.down = true;
            preventWhenDrone();
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;
      switch (code) {
        case "KeyW":
          movementRef.current.forward = false;
          break;
        case "KeyS":
          movementRef.current.back = false;
          break;
        case "KeyA":
          movementRef.current.left = false;
          break;
        case "KeyD":
          movementRef.current.right = false;
          break;
        case "Space":
          movementRef.current.up = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          movementRef.current.down = false;
          break;
        default:
          if (key === "Shift") movementRef.current.down = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    // right-click drag handlers on the canvas
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    // prevent default context menu on right-click so drag feels natural
    const preventContext = (ev: Event) => ev.preventDefault();
    renderer.domElement.addEventListener("contextmenu", preventContext);

    const onToggleDrone = () => {
      const next = !droneModeRef.current;
      droneModeRef.current = next;
      if (next) {
        // disable orbit controls and request pointer lock
        try {
          controlsRef.current.enabled = false;
          renderer.domElement.requestPointerLock();
        } catch (e) {
          /* ignore */
        }
      } else {
        try {
          document.exitPointerLock();
        } catch (e) {
          /* ignore */
        }
        controlsRef.current.enabled = true;
      }
      window.dispatchEvent(
        new CustomEvent("__droneModeChanged", { detail: next })
      );
    };

    window.addEventListener(
      "__toggleDroneMode",
      onToggleDrone as EventListener
    );

    // React state update bridge: listen for __droneModeChanged to update local React state
    const onDroneModeChanged = (e: any) => {
      try {
        setDroneMode(Boolean(e.detail));
      } catch (err) {
        setDroneMode(false);
      }
    };
    window.addEventListener(
      "__droneModeChanged",
      onDroneModeChanged as EventListener
    );

    // watch for prop changes via a mutation observer on models array by polling in RAF tick.
    // Simpler approach: re-run update when `models` changes by using another effect below that
    // has `models` in its dependency array. To keep this effect self-contained, we set up a
    // small interval to detect changes to incoming models prop via the closure.
    // (We'll also rely on React to recreate this effect when dependencies change.)

    let raf = 0;
    let prevTime = performance.now();
    const startTime = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.1, (now - prevTime) / 1000);
      prevTime = now;
      const elapsed = (now - startTime) / 1000;

      // apply drone movement if enabled
      if (droneModeRef.current) {
        const cam = cameraRef.current;
        if (cam) {
          const speed = 3; // units per second
          const move = movementRef.current;
          // forward/back based on camera direction
          const dir = new THREE.Vector3();
          cam.getWorldDirection(dir);
          // ignore vertical component for forward/back movement
          const forward = new THREE.Vector3(dir.x, 0, dir.z).normalize();
          const right = new THREE.Vector3()
            .crossVectors(forward, new THREE.Vector3(0, 1, 0))
            .normalize();
          const deltaPos = new THREE.Vector3();
          if (move.forward) deltaPos.add(forward);
          if (move.back) deltaPos.sub(forward);
          if (move.right) deltaPos.add(right);
          if (move.left) deltaPos.sub(right);
          if (move.up) deltaPos.y += 1;
          if (move.down) deltaPos.y -= 1;
          if (deltaPos.lengthSq() > 0) {
            deltaPos.normalize().multiplyScalar(speed * dt);
            cam.position.add(deltaPos);
          }
        }
      }

      // advance any custom per-model animations
      try {
        for (const anim of customAnimations.values()) {
          try {
            anim.update(elapsed);
          } catch (e) {
            /* ignore per-animation errors */
          }
        }
      } catch (e) {
        /* ignore animation errors */
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", onResize);
    // selection is handled by ViewerControls (it was moved out of the viewer)

    // create overlay element with instructions and toggle button
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "12px";
    overlay.style.left = "12px";
    overlay.style.padding = "8px 10px";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.color = "#fff";
    overlay.style.fontSize = "13px";
    overlay.style.borderRadius = "6px";
    overlay.style.zIndex = "999";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      // pointer listener cleaned up by ViewerControls
      try {
        controlsApi.dispose();
      } catch (e) {}
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener(
        "__toggleDroneMode",
        onToggleDrone as EventListener
      );
      window.removeEventListener(
        "__droneModeChanged",
        onDroneModeChanged as EventListener
      );
      window.removeEventListener(
        "__openModelModal",
        handleExternalOpen as EventListener
      );
      try {
        if (overlay && overlay.parentElement)
          overlay.parentElement.removeChild(overlay);
      } catch (e) {
        /* ignore */
      }
      controls.dispose();
      // remove and dispose all loaded objects
      for (const obj of objects.values()) {
        try {
          scene.remove(obj);
        } catch (e) {
          /* ignore */
        }
      }
      objects.clear();
      // dispose cloned materials and textures
      try {
        clonedMaterials.forEach((m) => {
          try {
            m.dispose();
          } catch (e) {
            // ignore
          }
        });
        appliedTextures.forEach((t) => {
          try {
            t.dispose();
          } catch (e) {
            // ignore
          }
        });
      } catch (e) {
        // ignore
      }
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, JSON.stringify(models || [])]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        ...(style || {}),
      }}
    />
  );
}
