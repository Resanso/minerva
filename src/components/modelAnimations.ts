import * as THREE from "three";

export type ModelAnimation = {
  update: (elapsed: number) => void;
  dispose?: () => void;
};

/**
 * Create a left-right ping-pong animation for an object.
 * obj.position.x will be updated each frame.
 */
export function createLeftRightAnimation(
  obj: THREE.Object3D,
  opts?: {
    baseX?: number;
    amplitude?: number;
    period?: number;
  }
): ModelAnimation {
  const baseX =
    typeof opts?.baseX === "number" ? opts!.baseX! : obj.position.x || 0;
  const amplitude = opts?.amplitude ?? 1.2;
  const period = opts?.period ?? 1.4;

  return {
    update(elapsed: number) {
      try {
        const phase = (elapsed % period) / period; // 0..1
        const ping = Math.abs(phase * 2 - 1); // 0..1..0
        const x = baseX - amplitude + ping * (2 * amplitude);
        obj.position.x = x;
      } catch (e) {
        // ignore per-frame errors
      }
    },
    dispose() {
      // nothing to dispose for this simple animation
    },
  };
}

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
