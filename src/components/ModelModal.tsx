"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as THREE from "three";
import type { Euler, Vector3 } from "three";
import {
  Button,
  HeroUIProvider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

// --- Fungsi Helper Baru untuk Warna Health Score ---
/**
 * Mendapatkan kelas Tailwind untuk warna UI berdasarkan skor kesehatan.
 * @param health - Skor kesehatan (0-100)
 */
const getHealthColorClasses = (health: number) => {
  // 20% = Merah
  if (health <= 20) {
    return {
      bg: "bg-red-500/10",
      text: "text-red-500",
      border: "border-red-500/30",
      badge: "bg-red-500",
    };
  }
  // 43%, 55% = Kuning
  if (health <= 55) {
    return {
      bg: "bg-yellow-500/10",
      text: "text-yellow-500",
      border: "border-yellow-500/30",
      badge: "bg-yellow-500",
    };
  }
  // 68%, 76%, 90% = Hijau
  return {
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/30",
    badge: "bg-green-500",
  };
};

type ModelModalOptions = {
  id: string;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  description?: string;
  objectSnapshot?: THREE.Object3D;
  onClose?: () => void;
};

type MachineIndicators = Record<string, string>;

type MachineAlarms = {
  active: number;
  total: number;
  list: string[];
};

type PredictiveMaintenanceEntry = {
  part: string;
  predictive: string;
  last: string;
  health: number;
  thumbnail?: string;
};

type PrescriptiveMaintenanceEntry = {
  whatHappened: string;
  why: string;
  recommendedAction: string;
};

type MachineDetails = {
  id: string;
  previewImage: string;
  title: string;
  machineId: string;
  PLC: string;
  nodeRed: string;
  dateAdded: string;
  location: string;
  indicators: MachineIndicators;
  alarms: MachineAlarms;
  predictiveMaintenance: PredictiveMaintenanceEntry[];
  healthScore: number;
  prescriptiveMaintenance?: PrescriptiveMaintenanceEntry;
};

type MachinesPayload = {
  machines?: MachineDetails[];
};

async function loadMachines(): Promise<MachineDetails[]> {
  const response = await fetch("/3d-model/modal-data.json", {
    cache: "no-store",
    headers: {
      "cache-control": "no-store",
    },
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const json: MachinesPayload = await response.json();
  const list = Array.isArray(json?.machines) ? json.machines : [];
  return list.map((item) => {
    const predictive = Array.isArray(item.predictiveMaintenance)
      ? item.predictiveMaintenance
      : [];
    const health = typeof item.healthScore === "number" ? item.healthScore : 0;
    const prescriptive =
      item &&
      typeof item === "object" &&
      item.prescriptiveMaintenance &&
      typeof item.prescriptiveMaintenance === "object"
        ? item.prescriptiveMaintenance
        : {
            whatHappened: "-",
            why: "-",
            recommendedAction: "-",
          };
    return {
      ...item,
      predictiveMaintenance: predictive,
      healthScore: health,
      prescriptiveMaintenance: prescriptive,
    };
  });
}

async function loadMachineById(id: string): Promise<MachineDetails | null> {
  try {
    const machines = await loadMachines();
    return machines.find((item) => item.id === id) ?? null;
  } catch (error) {
    console.error("Failed to load machine metadata", error);
    return null;
  }
}

// Fungsi formatVector dan formatRotation tidak diubah,
// meskipun UI baru tidak menampilkannya.
function formatVector(vec?: Vector3, fractionDigits = 2) {
  if (!vec) return "N/A";
  const factor = Math.pow(10, fractionDigits);
  const values = vec.toArray();
  return values.map((v) => Math.round(v * factor) / factor).join(", ");
}

function formatRotation(euler?: Euler, fractionDigits = 1) {
  if (!euler) return "N/A";
  const factor = Math.pow(10, fractionDigits);
  const toDegrees = (r: number) => (r * 180) / Math.PI;
  return [euler.x, euler.y, euler.z]
    .map((v) => Math.round(toDegrees(v) * factor) / factor)
    .map((v) => `${v} deg`)
    .join(", ");
}

function ModelModal(props: ModelModalOptions) {
  const {
    id,
    position,
    rotation,
    scale,
    description,
    objectSnapshot,
    onClose,
  } = props;
  const [isOpen, setIsOpen] = useState(true);
  const hasClosedRef = useRef(false);
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const [machine, setMachine] = useState<MachineDetails | null>(null);
  const [machineLoading, setMachineLoading] = useState(true);

  // Memo ini tidak lagi digunakan di UI baru, tapi kita biarkan
  const positionLabel = useMemo(() => formatVector(position, 3), [position]);
  const scaleLabel = useMemo(() => formatVector(scale, 2), [scale]);
  const rotationLabel = useMemo(() => formatRotation(rotation, 1), [rotation]);

  const maintenanceItems = machine?.predictiveMaintenance ?? [];
  const maintenanceCount = maintenanceItems.length;
  const prescriptive = machine?.prescriptiveMaintenance;

  useEffect(() => {
    let isMounted = true;
    setMachineLoading(true);
    loadMachineById(id).then((result) => {
      if (!isMounted) return;
      setMachine(result);
      setMachineLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const host = previewHostRef.current;
    if (!host || !objectSnapshot) return;

    // clear any previous canvas
    host.innerHTML = "";

    const width = host.clientWidth || 240;
    const height = host.clientHeight || 256; // Sesuaikan tinggi default

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Latar belakang canvas

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(3, 4, 6);
    scene.add(ambient);
    scene.add(directional);

    const previewObject = objectSnapshot.clone(true);

    const box = new THREE.Box3().setFromObject(previewObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    previewObject.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const desired = 1.8;
      const scaleFactor = desired / maxDim;
      previewObject.scale.multiplyScalar(scaleFactor);
    }
    scene.add(previewObject);

    const fov = (camera.fov * Math.PI) / 180;
    const distance = maxDim > 0 ? (maxDim / (2 * Math.tan(fov / 2))) * 2.2 : 3;
    camera.position.set(0, 0, distance);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      previewObject.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const newWidth = host.clientWidth || width;
            const newHeight = host.clientHeight || height;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
          })
        : null;
    if (resizeObserver) resizeObserver.observe(host);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      host.innerHTML = "";
    };
  }, [objectSnapshot, id]);

  useEffect(() => {
    if (!isOpen && !hasClosedRef.current) {
      hasClosedRef.current = true;
      try {
        onClose?.();
      } catch (err) {
        console.error("ModelModal onClose handler failed", err);
      }
      const detach = () => unmountModelModal();
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(detach);
      } else {
        detach();
      }
    }
  }, [isOpen, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      onOpenChange={(open) => setIsOpen(open)}
      scrollBehavior="inside"
      backdrop="blur"
      placement="center"
    >
      <ModalContent className="bg-[#0F172A] text-white">
        {(close) => (
          <>
            <ModalHeader className="border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {machine?.title ?? description ?? id}
              </h3>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6">
              {/* --- BAGIAN ATAS (Info & Status) --- */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* --- Kolom Kiri --- */}
                <div className="flex flex-col gap-6 lg:col-span-4">
                  {/* Kartu 3D Preview */}
                  <section className="rounded-lg bg-[#1E293B] p-4">
                    <div
                      className="relative w-full h-64 overflow-hidden rounded-md bg-[#0F172A]"
                      ref={previewHostRef}
                    >
                      {!objectSnapshot && (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          3D preview unavailable
                        </div>
                      )}
                      {/* Canvas Three.js akan dimuat di sini */}
                    </div>
                  </section>

                  {/* Kartu Machine Info */}
                  <section className="rounded-lg bg-[#1E293B] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500"></div>
                      <h4 className="text-base font-semibold text-white">
                        {machine?.title ?? description ?? id}
                      </h4>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Machine ID</p>
                        <p className="text-white font-medium">
                          {machine?.machineId ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">PLC</p>
                        <p className="text-white font-medium">
                          {machine?.PLC ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">NodeRed</p>
                        <p className="text-white font-medium">
                          {machine?.nodeRed ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date Add</p>
                        <p className="text-white font-medium">
                          {machine?.dateAdded ?? "-"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-white font-medium">
                          {machine?.location ?? "-"}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* --- Kolom Kanan --- */}
                <div className="flex flex-col gap-6 lg:col-span-8">
                  {/* Kartu Indicators */}
                  <section className="rounded-lg bg-[#1E293B] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500"></div>
                        <h4 className="text-base font-semibold text-white">
                          {machine?.title ?? "Indicators"}
                        </h4>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="solid"
                        className="rounded-full !bg-red-600"
                      >
                        Trouble
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {machine?.indicators ? (
                        Object.entries(machine.indicators).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="rounded-lg bg-[#0F172A] p-3"
                            >
                              <p className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {key}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-white">
                                {value ?? "-"}
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-gray-400 col-span-3">
                          No indicator data.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* Kartu Alarms */}
                  <section className="rounded-lg bg-[#1E293B] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-3 h-3 rounded-full bg-red-500"></div>
                        <h4 className="text-base font-semibold text-white">
                          Homogenizing Alarms
                        </h4>
                        <span className="text-sm text-red-500">
                          {machine?.alarms?.active ?? 0} Active
                        </span>
                        <span className="text-sm text-gray-400">
                          ({machine?.alarms?.total ?? 0} total)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                          Last update: 10:42:19 PM
                        </span>
                        <Button
                          size="sm"
                          color="primary"
                          variant="solid"
                          className="rounded-md"
                        >
                          Show All
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {machine?.alarms?.list &&
                      machine.alarms.list.length > 0 ? (
                        machine.alarms.list.slice(0, 5).map((alarm, index) => (
                          <div
                            key={alarm}
                            className="rounded-lg bg-[#0F172A] p-3 flex items-center gap-3"
                          >
                            <span
                              className={`w-3 h-3 rounded-full ${
                                index < (machine?.alarms?.active ?? 0)
                                  ? "bg-green-500" // Aktif
                                  : "bg-gray-500" // Tidak Aktif
                              }`}
                            ></span>
                            <p className="text-sm font-medium text-white">
                              {alarm}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">No alarms registered.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* --- BAGIAN PREDICTIVE MAINTENANCE --- */}
              <section className="rounded-lg bg-[#1E293B] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">
                      Predictive Maintenance
                    </h4>
                    <p className="text-sm text-gray-400">
                      {machine?.title ?? id}
                      {maintenanceCount ? (
                        <span className="ml-2">({maintenanceCount} total)</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {typeof machine?.healthScore === "number" && (
                      <span
                        className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ${
                          getHealthColorClasses(machine.healthScore).badge
                        } bg-opacity-80 text-white`}
                      >
                        {machine.healthScore}%
                        <span className="ml-2 font-normal opacity-80">
                          Health Score
                        </span>
                      </span>
                    )}
                    <Button
                      size="sm"
                      color="primary"
                      variant="solid"
                      className="rounded-md"
                    >
                      Show All
                    </Button>
                  </div>
                </div>

                {maintenanceCount > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {maintenanceItems.map((item) => {
                      const healthColors = getHealthColorClasses(item.health);
                      return (
                        <article
                          key={item.part}
                          className={`flex flex-col justify-between rounded-lg bg-[#0F172A] p-4 border ${healthColors.border} ${healthColors.bg}`}
                        >
                          <div>
                            <div className="flex items-start gap-4">
                              {item.thumbnail ? (
                                <img
                                  src={item.thumbnail}
                                  alt={`${item.part} thumbnail`}
                                  className="h-20 w-20 rounded-lg object-contain bg-white/5 p-1"
                                />
                              ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/5 text-[11px] text-gray-400">
                                  No image
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <p className="text-base font-semibold text-white">
                                  {item.part}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Predictive: {item.predictive || "-"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Last: {item.last || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="solid"
                              color="primary"
                              className="rounded-md"
                            >
                              Detail
                            </Button>
                            <span
                              className={`rounded-md px-3 py-1 text-sm font-semibold ${healthColors.badge} bg-opacity-80 text-white`}
                            >
                              {item.health}%
                              <span className="ml-1.5 font-normal opacity-80">
                                Health Score
                              </span>
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-400">
                    No predictive maintenance records available.
                  </p>
                )}
              </section>

              {/* --- BAGIAN PRESCRIPTIVE ANALYSIS --- */}
              <section className="rounded-lg bg-[#1E293B] p-4">
                <h4 className="text-base font-semibold text-white">
                  Prescriptive Analysis
                </h4>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What Happened */}
                  <article className="rounded-lg bg-[#0F172A] p-4">
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      What Happened?
                    </h5>
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                      {prescriptive?.whatHappened ?? "-"}
                    </p>
                  </article>

                  {/* Why / How It Happened */}
                  <article className="rounded-lg bg-[#0F172A] p-4">
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Why / How It Happened?
                    </h5>
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                      {prescriptive?.why ?? "-"}
                    </p>
                  </article>
                </div>

                {/* Recommended Action */}
                <article className="mt-4 rounded-lg bg-[#0F172A] p-4">
                  <h5 className="text-sm font-semibold text-white">
                    Recommended Action
                  </h5>
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {prescriptive?.recommendedAction ?? "-"}
                  </p>
                </article>
              </section>
            </ModalBody>
            <ModalFooter className="border-t border-white/10">
              <Button
                color="primary"
                variant="solid"
                onPress={close}
                className="rounded-md"
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function mountModelModal(options: ModelModalOptions) {
  if (typeof document === "undefined") return;

  if (!container) {
    container = document.createElement("div");
    container.id = "model-modal-root";
    document.body.appendChild(container);
  }

  if (!root) {
    root = createRoot(container);
  }

  root.render(
    // Terapkan 'dark' mode di sini
    <HeroUIProvider className="dark">
      <ModelModal {...options} />
    </HeroUIProvider>
  );
}

export function unmountModelModal() {
  if (root) {
    root.unmount();
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
}

export type { ModelModalOptions };
