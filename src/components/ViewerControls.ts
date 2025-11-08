import * as THREE from "three";

export type ViewerControlsAPI = {
  showForObject: (obj: THREE.Object3D, meta?: any) => void;
  hide: () => void;
  dispose: () => void;
  onColorChange: (cb: (color: string) => void) => void;
  onScaleChange: (cb: (scale: number) => void) => void;
  onRotateChange: (cb: (rx: number, ry: number) => void) => void;
  onAnimationCommand: (
    cb: (cmd: { play?: boolean; clip?: string; speed?: number }) => void
  ) => void;
};

export function createViewerControls(
  container: HTMLElement,
  deps?: {
    getObjects?: () => THREE.Object3D[];
    camera?: THREE.Camera;
    domElement?: HTMLElement;
    onSelect?: (info: { object: THREE.Object3D; meta?: any }) => void;
    onDeselect?: () => void;
  }
): ViewerControlsAPI {
  const panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.right = "12px";
  panel.style.top = "12px";
  panel.style.padding = "10px";
  panel.style.background = "rgba(0,0,0,0.6)";
  panel.style.color = "#fff";
  panel.style.fontSize = "13px";
  panel.style.borderRadius = "8px";
  panel.style.zIndex = "1000";
  panel.style.minWidth = "180px";
  panel.style.display = "none";

  panel.innerHTML = `
    <div style="font-weight:600;margin-bottom:8px">Model Controls</div>
    <label style="display:block;margin-bottom:6px">Color: <input id="vc-color" type="color" value="#ffffff"/></label>
    <label style="display:block;margin-bottom:6px">Scale: <input id="vc-scale" type="range" min="0.1" max="3" step="0.01" value="1"/></label>
    <label style="display:block;margin-bottom:6px">Rotate X: <input id="vc-rotx" type="range" min="-180" max="180" step="1" value="0"/></label>
    <label style="display:block;margin-bottom:6px">Rotate Y: <input id="vc-roty" type="range" min="-180" max="180" step="1" value="0"/></label>
    <div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">
      <div style="margin-bottom:6px;font-weight:600">Animation</div>
      <select id="vc-clip" style="width:100%;margin-bottom:6px"><option value="">(no clip)</option></select>
      <div style="display:flex;gap:6px;align-items:center">
        <button id="vc-play" style="flex:1">Play</button>
        <button id="vc-pause">Pause</button>
      </div>
      <label style="display:block;margin-top:6px">Speed: <input id="vc-speed" type="range" min="0.1" max="3" step="0.1" value="1"/></label>
    </div>
  `;

  container.appendChild(panel);

  const colorInput = panel.querySelector<HTMLInputElement>("#vc-color")!;
  const scaleInput = panel.querySelector<HTMLInputElement>("#vc-scale")!;
  const rotXInput = panel.querySelector<HTMLInputElement>("#vc-rotx")!;
  const rotYInput = panel.querySelector<HTMLInputElement>("#vc-roty")!;
  const clipSelect = panel.querySelector<HTMLSelectElement>("#vc-clip")!;
  const playBtn = panel.querySelector<HTMLButtonElement>("#vc-play")!;
  const pauseBtn = panel.querySelector<HTMLButtonElement>("#vc-pause")!;
  const speedInput = panel.querySelector<HTMLInputElement>("#vc-speed")!;

  let currentObj: THREE.Object3D | null = null;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // handle selection if deps provided
  const dom = deps?.domElement;
  const camera = deps?.camera;
  const getObjects = deps?.getObjects;
  const onPointerInteract = (e: PointerEvent) => {
    try {
      if (!dom || !camera || !getObjects) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const objs = getObjects();
      const intersects = raycaster.intersectObjects(objs, true);
      if (intersects && intersects.length > 0) {
        let picked: any = intersects[0].object;
        while (picked && !picked.userData?.modelId) picked = picked.parent;
        if (picked) {
          showForObject(picked, { clips: picked.userData?.clips || [] });
          return;
        }
      }
      hide();
    } catch (err) {
      /* ignore */
    }
  };
  if (dom) dom.addEventListener("pointerup", onPointerInteract as any);

  const colorCbs: Array<(c: string) => void> = [];
  const scaleCbs: Array<(s: number) => void> = [];
  const rotateCbs: Array<(rx: number, ry: number) => void> = [];
  const animCbs: Array<
    (cmd: { play?: boolean; clip?: string; speed?: number }) => void
  > = [];

  colorInput.addEventListener("input", () => {
    const v = colorInput.value;
    // apply directly to current object if present
    if (currentObj) {
      currentObj.traverse((c: any) => {
        if (c.isMesh && c.material) {
          try {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach((mm: any) => {
              if (mm.color) mm.color.set(v);
              mm.needsUpdate = true;
            });
          } catch (e) {
            /* ignore */
          }
        }
      });
    }
    for (const cb of colorCbs) cb(v);
  });
  scaleInput.addEventListener("input", () => {
    const v = parseFloat(scaleInput.value);
    if (currentObj) {
      try {
        currentObj.scale.setScalar(v);
      } catch (e) {}
    }
    for (const cb of scaleCbs) cb(v);
  });
  rotXInput.addEventListener("input", () => {
    const rx = (parseFloat(rotXInput.value) * Math.PI) / 180;
    const ry = (parseFloat(rotYInput.value) * Math.PI) / 180;
    if (currentObj) {
      try {
        currentObj.rotation.set(rx, ry, currentObj.rotation.z || 0);
      } catch (e) {}
    }
    for (const cb of rotateCbs) cb(rx, ry);
  });
  rotYInput.addEventListener("input", () => {
    const rx = (parseFloat(rotXInput.value) * Math.PI) / 180;
    const ry = (parseFloat(rotYInput.value) * Math.PI) / 180;
    if (currentObj) {
      try {
        currentObj.rotation.set(rx, ry, currentObj.rotation.z || 0);
      } catch (e) {}
    }
    for (const cb of rotateCbs) cb(rx, ry);
  });

  clipSelect.addEventListener("change", () => {
    for (const cb of animCbs) cb({ clip: clipSelect.value });
  });
  playBtn.addEventListener("click", () => {
    for (const cb of animCbs) cb({ play: true });
  });
  pauseBtn.addEventListener("click", () => {
    for (const cb of animCbs) cb({ play: false });
  });
  speedInput.addEventListener("input", () => {
    for (const cb of animCbs) cb({ speed: parseFloat(speedInput.value) });
  });

  function showForObject(obj: THREE.Object3D, meta: any = {}) {
    currentObj = obj;
    // hide the side panel when a model is selected (use modal instead)
    panel.style.display = "none";
    // pre-fill rotation and scale
    try {
      const rx = (obj.rotation.x * 180) / Math.PI;
      const ry = (obj.rotation.y * 180) / Math.PI;
      rotXInput.value = String(Math.round(rx));
      rotYInput.value = String(Math.round(ry));
    } catch (e) {}
    try {
      scaleInput.value = String(obj.scale.x || 1);
    } catch (e) {}
    // list animation clips if provided via meta.clips (array of names)
    try {
      const clips: string[] = meta?.clips || [];
      clipSelect.innerHTML =
        '<option value="">(no clip)</option>' +
        clips.map((c) => `<option value=\"${c}\">${c}</option>`).join("");
    } catch (e) {}

    if (deps?.onSelect) {
      try {
        deps.onSelect({ object: obj, meta });
      } catch (err) {
        console.error("ViewerControls onSelect handler failed", err);
      }
      return;
    }

    // show modal with basic info for the selected model when no custom handler provided
    try {
      showModalForObject(obj, meta);
    } catch (e) {
      /* ignore modal errors */
    }
  }

  function hide() {
    panel.style.display = "none";
    currentObj = null;
    if (deps?.onDeselect) {
      try {
        deps.onDeselect();
      } catch (err) {
        console.error("ViewerControls onDeselect handler failed", err);
      }
      return;
    }
    try {
      hideModal();
    } catch (e) {
      /* ignore */
    }
  }

  function dispose() {
    try {
      panel.remove();
    } catch (e) {
      /* ignore */
    }
    try {
      if (dom) dom.removeEventListener("pointerup", onPointerInteract as any);
    } catch (e) {
      /* ignore */
    }
    if (deps?.onDeselect) {
      try {
        deps.onDeselect();
      } catch (err) {
        console.error("ViewerControls dispose onDeselect failed", err);
      }
    } else {
      try {
        hideModal();
      } catch (e) {}
    }
  }

  // --- modal implementation ---
  // Instead of a DOM-based modal, mount the React-based ModelModal component.
  // This avoids duplicating complex UI logic here and keeps the viewer code focused.
  let mounted = false;
  async function showModalForObject(obj: THREE.Object3D, meta: any = {}) {
    try {
      // dynamic import to avoid importing React server-side or at module load time
      const mod = await import("./ModelModal");
      const id = obj.userData?.modelId || obj.name || "(unknown)";
      const pos = obj.position.clone();
      const rot = obj.rotation.clone();
      const sc = obj.scale.clone();
      mounted = true;
      mod.mountModelModal({
        id,
        position: pos,
        rotation: rot,
        scale: sc,
        description: meta?.description,
        objectSnapshot: obj.clone(true),
        onClose: () => {
          mounted = false;
        },
      });
    } catch (e) {
      // if anything fails, swallow the error so viewer stays functional
      console.error("Failed to open React modal:", e);
    }
  }

  function hideModal() {
    if (!mounted) return;
    try {
      const mod = require("./ModelModal");
      mod.unmountModelModal();
    } catch (e) {
      /* ignore */
    }
    mounted = false;
  }

  return {
    showForObject,
    hide,
    dispose,
    onColorChange(cb) {
      colorCbs.push(cb);
    },
    onScaleChange(cb) {
      scaleCbs.push(cb);
    },
    onRotateChange(cb) {
      rotateCbs.push(cb);
    },
    onAnimationCommand(cb) {
      animCbs.push(cb);
    },
  };
}
