"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { createRoot, Root } from "react-dom/client";

type ModalProps = {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  description?: string;
  onClose?: () => void;
};

// Small, local shadcn-like primitives (fallback) so the modal looks consistent even when
// the project's shadcn UI components are not installed. If you already have shadcn UI,
// replace these with imports from your ui library.
function Dialog({
  children,
  open,
}: {
  children: React.ReactNode;
  open: boolean;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>{children}</div>
  );
}
function DialogOverlay({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
    />
  );
}
function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        minWidth: 320,
        maxWidth: "90%",
        background: "#0f1724",
        color: "#fff",
        padding: 16,
        borderRadius: 10,
        boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        // limit height and allow internal scrolling
        maxHeight: "80vh",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function DialogHeader({
  title,
  onClose,
}: {
  title: string;
  onClose?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 700 }}>{title}</div>
      {onClose ? (
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function ModelModal({
  id,
  position,
  rotation,
  scale,
  description,
  onClose,
}: ModalProps) {
  const [record, setRecord] = useState<any | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const threeState = useRef<any>({});
  const resizeHandlerRef = useRef<((...args: any[]) => any) | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/3d-model/modal-data.json");
        if (!res.ok) return;
        const json = await res.json();
        const found = json?.machines?.find((m: any) => m.id === id) || null;
        if (mounted) setRecord(found);
      } catch (e) {
        // ignore fetch errors and keep record null
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    // attempt to load the 3d model specified in /3d-model/models.json for preview
    let mounted = true;
    let raf = 0;
    (async () => {
      try {
        const mres = await fetch("/3d-model/models.json");
        if (!mres.ok) return;
        const mjson = await mres.json();
        const modelEntry = mjson.find((x: any) => x.id === id) || null;
        if (!modelEntry || !mounted || !previewRef.current) return;

        const container = previewRef.current;
        // dynamic imports for three extras
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader"
        );

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(
          45,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0.5, 2.2);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        scene.add(light);

        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 10, 7.5);
        scene.add(dir);

        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(modelEntry.src, resolve, undefined, reject);
        });

        const obj = gltf.scene || gltf.scenes?.[0] || gltf;
        // normalize scale
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scaleFactor = (1.0 / maxDim) * (modelEntry.scale || 1);
        obj.scale.setScalar(scaleFactor);
        obj.position.set(0, -size.y * 0.5 * scaleFactor, 0);
        scene.add(obj);

        threeState.current = { scene, renderer, camera, obj };

        // declare onResize so we can remove it during cleanup
        const onResize = () => {
          if (!container) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        // store reference so cleanup can remove it
        resizeHandlerRef.current = onResize;
        window.addEventListener("resize", onResize);

        const animate = () => {
          obj.rotation.y += 0.01;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        };
        animate();
      } catch (e) {
        // ignore preview failures
      }
    })();

    return () => {
      mounted = false;
      try {
        if (threeState.current?.renderer) {
          if (threeState.current.obj)
            threeState.current.scene.remove(threeState.current.obj);
          threeState.current.renderer.dispose();
          const dom = threeState.current.renderer.domElement;
          dom?.remove();
          try {
            if (resizeHandlerRef.current) {
              window.removeEventListener(
                "resize",
                resizeHandlerRef.current as any
              );
              resizeHandlerRef.current = null;
            }
          } catch (e) {}
        }
      } catch (e) {}
      cancelAnimationFrame(raf);
    };
  }, [id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Dialog open={true}>
      <DialogOverlay onClick={onClose} />
      <DialogContent>
        <DialogHeader title={`Model: ${id}`} onClose={onClose} />

        {/* scrollable body */}
        <div style={{ overflowY: "auto", paddingRight: 8 }}>
          {/* two column grid: left metadata/thumb, right details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: 16,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                ref={previewRef}
                style={{
                  height: 180,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  border: "1px solid rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  background: "#071024",
                }}
              >
                <div style={{ padding: 8 }}>3D Preview</div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{
                    background: "#071024",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Machine ID
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {record?.machineId || id}
                  </div>
                </div>
                <div
                  style={{
                    background: "#071024",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>PLC</div>
                  <div>{record?.PLC ?? "—"}</div>
                </div>
                <div
                  style={{
                    background: "#071024",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Date Added
                  </div>
                  <div>
                    {record?.dateAdded ?? new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* indicators row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: "#06202a",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Air Temperature
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {record?.indicators?.airTemperature ?? "—"}
                  </div>
                </div>
                <div
                  style={{
                    background: "#06202a",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Billet Temperature
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {record?.indicators?.billetTemperature ?? "—"}
                  </div>
                </div>
                <div
                  style={{
                    background: "#06202a",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Number of Billet
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {record?.indicators?.numberOfBillet ?? "—"}
                  </div>
                </div>
              </div>

              {/* Alarms box */}
              <div
                style={{ background: "#071024", padding: 12, borderRadius: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Alarms</div>
                  <div
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {record?.alarms?.active ?? 0} Active
                  </div>
                </div>
                <div style={{ marginTop: 8, color: "#9ca3af" }}>
                  {record?.alarms?.list && record.alarms.list.length
                    ? record.alarms.list.join(", ")
                    : "No active alarms."}
                </div>
              </div>

              {/* Predictive maintenance - small cards grid */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Predictive Maintenance
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      background: "#071024",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Gear</div>
                    <div style={{ fontWeight: 700 }}>
                      {record?.predictiveMaintenance?.[0]?.health ?? "-"}%
                      Health
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#071024",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Pulley</div>
                    <div style={{ fontWeight: 700 }}>
                      {record?.predictiveMaintenance?.[1]?.health ?? "-"}%
                      Health
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescriptive maintenance */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: "#071024",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    What Happened?
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
                    {record?.prescriptiveMaintenance?.whatHappened ??
                      description ??
                      "The component shows degradation and increased vibration."}
                  </div>
                </div>
                <div
                  style={{
                    background: "#071024",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Why / How It Happened?
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>
                    {record?.prescriptiveMaintenance?.why ??
                      "Mechanical wear from prolonged operation under heavy load."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer - always visible */}
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

let modalRoot: HTMLDivElement | null = null;
let reactRoot: Root | null = null;

export function mountModelModal(props: {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  description?: string;
  onClose?: () => void;
}) {
  if (typeof document === "undefined") return;
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    document.body.appendChild(modalRoot);
    reactRoot = createRoot(modalRoot);
  }
  reactRoot!.render(
    <ModelModal
      id={props.id}
      position={{
        x: props.position.x,
        y: props.position.y,
        z: props.position.z,
      }}
      rotation={{
        x: props.rotation.x,
        y: props.rotation.y,
        z: props.rotation.z,
      }}
      scale={{ x: props.scale.x, y: props.scale.y, z: props.scale.z }}
      description={props.description}
      onClose={() => {
        unmountModelModal();
        props.onClose && props.onClose();
      }}
    />
  );
}

export function unmountModelModal() {
  try {
    if (reactRoot && modalRoot) {
      reactRoot.unmount();
      modalRoot.remove();
    }
  } catch (e) {
    /* ignore */
  }
  reactRoot = null;
  modalRoot = null;
}
