import * as THREE from "three";

export type ModelAnimation = {
  update: (elapsed: number) => void;
  dispose?: () => void;
};

/**
 * Create an animation where the object fades in (opacity 0->1) while moving to the right.
 * The object will move from (baseX) to (baseX + distance) over `duration` seconds and then loop.
 * This clones mesh materials to make them transparent; dispose() will free cloned materials.
 */
export function createFadeInMoveRightAnimation(
  obj: THREE.Object3D,
  opts?: {
    baseX?: number; // starting x
    distance?: number; // how far to move right
    duration?: number; // seconds for the fade+move
  }
): ModelAnimation {
  const baseX =
    typeof opts?.baseX === "number" ? opts!.baseX! : obj.position.x || 0;
  const distance = opts?.distance ?? 1.5;
  const duration = opts?.duration ?? 1.4;

  // collect and clone materials so we can animate opacity
  const clonedMaterials: THREE.Material[] = [];
  obj.traverse((child: any) => {
    if (child.isMesh) {
      const mat = child.material;
      if (mat) {
        if (Array.isArray(mat)) {
          const newMats = mat.map((m: any) => {
            const cloned = m.clone();
            try {
              cloned.transparent = true;
              (cloned as any).opacity = 0;
            } catch (e) {
              /* ignore */
            }
            cloned.needsUpdate = true;
            clonedMaterials.push(cloned);
            return cloned;
          });
          child.material = newMats as any;
        } else {
          const cloned = mat.clone();
          try {
            cloned.transparent = true;
            (cloned as any).opacity = 0;
          } catch (e) {
            /* ignore */
          }
          cloned.needsUpdate = true;
          child.material = cloned;
          clonedMaterials.push(cloned);
        }
      } else {
        const mm = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
        });
        mm.needsUpdate = true;
        child.material = mm;
        clonedMaterials.push(mm);
      }
    }
  });

  return {
    update(elapsed: number) {
      try {
        const phase = (elapsed % duration) / duration; // 0..1
        const progress = Math.max(0, Math.min(1, phase));
        const x = baseX + progress * distance;
        obj.position.x = x;
        const op = progress;
        for (const m of clonedMaterials) {
          try {
            (m as any).opacity = op;
            m.transparent = op < 1;
            m.needsUpdate = true;
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        // ignore per-frame errors
      }
    },
    dispose() {
      for (const m of clonedMaterials) {
        try {
          m.dispose();
        } catch (e) {
          /* ignore */
        }
      }
    },
  };
}

/**
 * Animate the ladle car moving along the factory path with a rotation during the corner turn.
 */
export function createLadleCarAnimation(
  obj: THREE.Object3D,
  opts?: {
    start?: [number, number, number];
    waypoint?: [number, number, number];
    end?: [number, number, number];
    startYawDeg?: number;
    endYawDeg?: number;
    forwardDuration?: number;
    cornerDuration?: number;
    cornerRotationDuration?: number;
    dwellDuration?: number;
    returnDuration?: number;
    returnRotationDuration?: number;
  }
): ModelAnimation {
  const start = new THREE.Vector3(
    opts?.start?.[0] ?? -2,
    opts?.start?.[1] ?? 0.05,
    opts?.start?.[2] ?? 2
  );
  const waypoint = new THREE.Vector3(
    opts?.waypoint?.[0] ?? 4.5,
    opts?.waypoint?.[1] ?? 0.05,
    opts?.waypoint?.[2] ?? 2
  );
  const end = new THREE.Vector3(
    opts?.end?.[0] ?? 4.5,
    opts?.end?.[1] ?? 0.05,
    opts?.end?.[2] ?? 6
  );
  const startYaw = THREE.MathUtils.degToRad(opts?.startYawDeg ?? 270);
  const endYaw = THREE.MathUtils.degToRad(opts?.endYawDeg ?? 180);
  const forwardDuration = Math.max(0.1, opts?.forwardDuration ?? 6);
  const cornerDuration = Math.max(0.1, opts?.cornerDuration ?? 4);
  const cornerRotationDuration = Math.min(
    cornerDuration,
    Math.max(0.1, opts?.cornerRotationDuration ?? 0.5)
  );
  const dwellDuration = Math.max(0, opts?.dwellDuration ?? 2);
  const resetDuration = Math.max(0, opts?.returnDuration ?? 0.5);
  const cycleDuration =
    forwardDuration + cornerDuration + dwellDuration + resetDuration;
  const temp = new THREE.Vector3();

  obj.position.copy(start);
  obj.rotation.set(0, startYaw, 0);

  const lerpPosition = (from: THREE.Vector3, to: THREE.Vector3, t: number) => {
    obj.position.copy(temp.copy(from).lerp(to, t));
  };

  return {
    update(elapsed: number) {
      if (!Number.isFinite(elapsed) || cycleDuration <= 0) return;
      const time = elapsed % cycleDuration;

      if (time < forwardDuration) {
        const progress = time / forwardDuration;
        lerpPosition(start, waypoint, progress);
        obj.rotation.set(0, startYaw, 0);
        return;
      }

      if (time < forwardDuration + cornerDuration) {
        const progress = (time - forwardDuration) / cornerDuration;
        lerpPosition(waypoint, end, progress);
        const rotationProgress = Math.min(
          1,
          (time - forwardDuration) / cornerRotationDuration
        );
        const yaw = THREE.MathUtils.lerp(startYaw, endYaw, rotationProgress);
        obj.rotation.set(0, yaw, 0);
        return;
      }

      if (time < forwardDuration + cornerDuration + dwellDuration) {
        lerpPosition(end, end, 0);
        obj.rotation.set(0, endYaw, 0);
        return;
      }

      obj.position.copy(start);
      obj.rotation.set(0, startYaw, 0);
    },
  };
}
