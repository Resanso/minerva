"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useSimulation } from "./SimulationProvider";
import type { SimulationStep } from "./simulation-data";

type LoadedObject = {
  object: THREE.Object3D;
  baseScale: number;
  basePosition: THREE.Vector3;
};

const FLOOR_SIZE = 120;

const normalizeObject = (object: THREE.Object3D, desiredSize = 1) => {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  object.position.sub(center);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scaleFactor = desiredSize / maxDim;
    object.scale.multiplyScalar(scaleFactor);
  }
};

function prepareSteps(steps: SimulationStep[]): SimulationStep[] {
  if (steps.every((step) => step.position)) return steps;
  const spacing = 3;
  const offset = (steps.length - 1) / 2;
  return steps.map((step, index) => ({
    ...step,
    position: step.position ?? [spacing * (index - offset), 0, 0],
  }));
}

export default function SimulationScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const objectsRef = useRef(new Map<string, LoadedObject>());
  const rafRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const { steps, activeMachineId } = useSimulation();
  const arrangedSteps = useMemo(() => prepareSteps(steps), [steps]);

  // keep latest active id in a ref for animation loop
  const activeIdRef = useRef<string | null>(activeMachineId);
  activeIdRef.current = activeMachineId;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 6, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.update();
    controlsRef.current = controls;

    // lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223344, 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.5);
    rimLight.position.set(-10, 8, -6);
    scene.add(rimLight);

    // floor and subtle grid
    const floorGeo = new THREE.CircleGeometry(FLOOR_SIZE, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(
      FLOOR_SIZE * 0.8,
      24,
      0x1d4ed8,
      0x1d4ed8
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const loader = new GLTFLoader();

    const setHighlight = (id: string | null) => {
      for (const [
        modelId,
        { object, baseScale, basePosition },
      ] of objectsRef.current) {
        const isActive = modelId === id;
        object.traverse((child: any) => {
          if (!child?.isMesh) return;
          const materials: THREE.Material[] = [];
          if (Array.isArray(child.material)) {
            materials.push(...child.material);
          } else if (child.material) {
            materials.push(child.material as THREE.Material);
          }
          for (const mat of materials) {
            mat.transparent = true;
            const targetOpacity = isActive ? 1 : 0.25;
            if ((mat as any).opacity !== targetOpacity) {
              (mat as any).opacity = targetOpacity;
              mat.needsUpdate = true;
            }
            if ("emissive" in mat && mat.emissive instanceof THREE.Color) {
              const emissiveColor = isActive ? 0x60a5fa : 0x000000;
              mat.emissive.setHex(emissiveColor);
              (mat as any).emissiveIntensity = isActive ? 0.7 : 0;
            }
          }
        });
        object.userData.baseScale = baseScale;
        object.userData.basePosition = basePosition;
      }
    };

    const loadStep = (step: SimulationStep, index: number) => {
      loader.load(
        step.modelSrc,
        (gltf) => {
          const obj = gltf.scene;
          obj.traverse((child: any) => {
            if (child?.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          normalizeObject(obj, 1);

          if (typeof step.scale === "number" && Number.isFinite(step.scale)) {
            obj.scale.multiplyScalar(step.scale);
          } else {
            obj.scale.multiplyScalar(1.5);
          }

          const hasRotation = Array.isArray(step.rotation);
          if (hasRotation) {
            const [rx = 0, ry = 0, rz = 0] = step.rotation ?? [0, 0, 0];
            const usesDegrees = [rx, ry, rz].some(
              (value) => Math.abs(value) > Math.PI * 2
            );
            const factor = usesDegrees ? Math.PI / 180 : 1;
            obj.rotation.set(rx * factor, ry * factor, rz * factor);
          }

          const [x = index * 2.5, y = 0, z = 0] = step.position ?? [
            index * 2.5,
            0,
            0,
          ];
          const adjustedY = y - 0.2;
          obj.position.set(x, adjustedY, z);

          scene.add(obj);
          const baseScale = obj.scale.x;
          const basePosition = new THREE.Vector3(x, adjustedY, z);
          objectsRef.current.set(step.id, {
            object: obj,
            baseScale,
            basePosition,
          });
          obj.userData.baseScale = baseScale;
          obj.userData.basePosition = basePosition;
          setHighlight(activeIdRef.current);
        },
        undefined,
        (error) => {
          // eslint-disable-next-line no-console
          console.error("Failed to load simulation model", step.id, error);
        }
      );
    };

    arrangedSteps.forEach(loadStep);

    const animate = () => {
      controls.update();

      const activeId = activeIdRef.current;
      for (const [
        modelId,
        { object, baseScale, basePosition },
      ] of objectsRef.current) {
        const goalScale = modelId === activeId ? baseScale * 1.12 : baseScale;
        const currentScale = object.scale.x;
        const nextScale = THREE.MathUtils.lerp(currentScale, goalScale, 0.12);
        object.scale.setScalar(nextScale);

        const targetHeight = basePosition.y + (modelId === activeId ? 0.35 : 0);
        object.position.x = THREE.MathUtils.lerp(
          object.position.x,
          basePosition.x,
          0.12
        );
        object.position.z = THREE.MathUtils.lerp(
          object.position.z,
          basePosition.z,
          0.12
        );
        object.position.y = THREE.MathUtils.lerp(
          object.position.y,
          targetHeight,
          0.12
        );
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      arrangedSteps.forEach((step) => {
        const loaded = objectsRef.current.get(step.id);
        if (!loaded) return;
        loaded.object.traverse((child: any) => {
          if (child?.isMesh) {
            const materials: THREE.Material[] = [];
            if (Array.isArray(child.material)) {
              materials.push(...child.material);
            } else if (child.material) {
              materials.push(child.material as THREE.Material);
            }
            materials.forEach((mat) => {
              if ("dispose" in mat && typeof mat.dispose === "function") {
                mat.dispose();
              }
            });
            if (child.geometry?.dispose) child.geometry.dispose();
          }
        });
        scene.remove(loaded.object);
      });
      objectsRef.current.clear();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [arrangedSteps]);

  useEffect(() => {
    // update highlight when active machine changes
    if (!objectsRef.current.size) return;
    for (const [
      modelId,
      { object, baseScale, basePosition },
    ] of objectsRef.current) {
      const isActive = modelId === activeMachineId;
      object.traverse((child: any) => {
        if (!child?.isMesh) return;
        const materials: THREE.Material[] = [];
        if (Array.isArray(child.material)) {
          materials.push(...child.material);
        } else if (child.material) {
          materials.push(child.material as THREE.Material);
        }
        for (const mat of materials) {
          (mat as any).transparent = true;
          (mat as any).opacity = isActive ? 1 : 0.25;
          if ("emissive" in mat && mat.emissive instanceof THREE.Color) {
            const emissiveColor = isActive ? 0x60a5fa : 0x000000;
            mat.emissive.setHex(emissiveColor);
            (mat as any).emissiveIntensity = isActive ? 0.7 : 0;
          }
          mat.needsUpdate = true;
        }
      });
      object.userData.baseScale = baseScale;
      object.userData.basePosition = basePosition;
      if (!isActive) {
        object.position.x = THREE.MathUtils.lerp(
          object.position.x,
          basePosition.x,
          0.18
        );
        object.position.y = THREE.MathUtils.lerp(
          object.position.y,
          basePosition.y,
          0.18
        );
        object.position.z = THREE.MathUtils.lerp(
          object.position.z,
          basePosition.z,
          0.18
        );
      }
    }
  }, [activeMachineId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ minHeight: "100vh", width: "100%" }}
    />
  );
}
