"use client";

import { useEffect, useRef, useState } from "react";
import type { Euler, Object3D, Vector3 } from "three";
import { createRoot, type Root } from "react-dom/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MachineDetails } from "@/lib/machines";
import { loadMachineById } from "@/lib/machines";

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
  description?: string;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  objectSnapshot?: Object3D;
  onClose?: () => void;
};

function ModelModal(props: ModelModalOptions) {
  const { id, description, onClose } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasClosedRef = useRef(false);
  const hasOpenedRef = useRef(false);
  const [machine, setMachine] = useState<MachineDetails | null>(null);

  const maintenanceItems = machine?.predictiveMaintenance ?? [];
  const maintenanceCount = maintenanceItems.length;
  const prescriptive = machine?.prescriptiveMaintenance;

  useEffect(() => {
    let isMounted = true;
    loadMachineById(id).then((result) => {
      if (!isMounted) return;
      setMachine(result);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      hasOpenedRef.current = true;
      setIsOpen(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      hasOpenedRef.current = true;
      setIsOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasOpenedRef.current) return;
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      modal={false}
    >
      {/* --- MODIFIKASI: Lebar diubah menjadi 30vw (responsif) --- */}
      <DialogContent
        className={`max-h-[90vh] w-[92vw] min-w-[320px] overflow-hidden bg-[#0F172A] p-0 text-white transition-[width] duration-200 md:top-1/2 md:translate-x-0! md:-translate-y-1/2 ${
          expanded
            ? "md:w-[64vw] lg:w-[60vw] xl:w-[56vw] md:left-auto! md:right-10! md:rounded-xl md:border md:border-white/10"
            : "md:w-[28vw] md:left-auto! md:right-6! md:rounded-l-xl md:rounded-r-none md:border-l md:border-white/10"
        }`}
      >
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-white">
              {machine?.title ?? description ?? id}
            </DialogTitle>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-md border border-white/10 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </DialogHeader>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* --- BAGIAN ATAS (Info & Status) --- */}
            {/* --- MODIFIKASI: Layout grid diubah jadi 1 kolom (tumpuk) --- */}
            <div className="grid grid-cols-1 gap-6">
              {/* --- Kolom Kiri (Hanya Info Mesin) --- */}
              <div className="flex flex-col gap-6">
                {/* --- DIHAPUS: Kartu 3D Preview --- */}

                {/* Kartu Machine Info */}
                <section className="rounded-lg bg-[#1E293B] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                    <h4 className="text-base font-semibold text-white">
                      {machine?.title ?? description ?? id}
                    </h4>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Machine ID</p>
                      <p className="font-medium text-white">
                        {machine?.machineId ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">PLC</p>
                      <p className="font-medium text-white">
                        {machine?.PLC ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">NodeRed</p>
                      <p className="font-medium text-white">
                        {machine?.nodeRed ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date Add</p>
                      <p className="font-medium text-white">
                        {machine?.dateAdded ?? "-"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="font-medium text-white">
                        {machine?.location ?? "-"}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* --- Kolom Kanan (Indicators & Alarms) --- */}
              <div className="flex flex-col gap-6">
                {/* Kartu Indicators */}
                <section className="rounded-lg bg-[#1E293B] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                      <h4 className="text-base font-semibold text-white">
                        {machine?.title ?? "Indicators"}
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full border-none bg-red-600 text-white hover:bg-red-500"
                    >
                      Trouble
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    {machine?.indicators ? (
                      Object.entries(machine.indicators).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-[#0F172A] p-3">
                          <p className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            {key}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {value ?? "-"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-3 text-gray-400">
                        No indicator data.
                      </p>
                    )}
                  </div>
                </section>

                {/* Kartu Alarms */}
                <section className="rounded-lg bg-[#1E293B] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
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
                      <Button size="sm" className="rounded-md">
                        Show All
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {machine?.alarms?.list && machine.alarms.list.length > 0 ? (
                      machine.alarms.list.slice(0, 5).map((alarm, index) => (
                        <div
                          key={alarm}
                          className="flex items-center gap-3 rounded-lg bg-[#0F172A] p-3"
                        >
                          <span
                            className={`h-3 w-3 rounded-full ${
                              index < (machine?.alarms?.active ?? 0)
                                ? "bg-green-500"
                                : "bg-gray-500"
                            }`}
                          />
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
              {/* HEADER SECTION 
    - flex-wrap: Memastikan item kanan (badge/button) bisa turun 
      ke bawah judul di layar yang sangat sempit.
  */}
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
                {/* ITEM KANAN HEADER
      - flex-wrap: Memastikan tombol "Show All" bisa turun 
        ke bawah Health Score jika keduanya tidak muat berdampingan.
      - justify-end: Memastikan item tetap di kanan saat wrapping.
      - gap-2 sm:gap-4: Mengurangi spasi di layar kecil.
    */}
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
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
                  <Button size="sm" className="rounded-md">
                    Show All
                  </Button>
                </div>
              </div>

              {maintenanceCount > 0 ? (
                /* GRID KARTU MAINTENANCE
      - Mengganti "md:grid-cols-2 lg:grid-cols-3" dengan teknik grid responsif
        yang otomatis menyesuaikan jumlah kolom.
      - "auto-fit": Buat kolom sebanyak mungkin.
      - "minmax(250px, 1fr)": Setiap kolom minimal 250px, 
        dan jika ada sisa ruang, bagi rata (1fr).
      - Ini jauh lebih robust daripada breakpoint tetap.
    */
                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
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
                                // shrink-0 mencegah gambar penyet saat teks panjang
                                className="h-20 w-20 shrink-0 rounded-lg bg-white/5 p-1 object-contain"
                              />
                            ) : (
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/5 text-center text-[11px] text-gray-400">
                                No image
                              </div>
                            )}
                            <div className="flex-1 space-y-1">
                              {/* TEXT OVERFLOW
                    - break-words: Memaksa teks yang sangat panjang 
                      (tanpa spasi) untuk pindah baris agar tidak 
                      merusak layout kartu.
                  */}
                              <p className="text-base font-semibold text-white wrap-break-word">
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
                        {/* FOOTER KARTU
              - flex-wrap: Memizinkan "Health Score" turun 
                ke bawah tombol "Detail" di layar sempit.
              - gap-2: Memberi jarak aman saat wrapping.
            */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <Button size="sm" className="rounded-md">
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

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* What Happened */}
                <article className="rounded-lg bg-[#0F172A] p-4">
                  <h5 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    What Happened?
                  </h5>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    {prescriptive?.whatHappened ?? "-"}
                  </p>
                </article>

                {/* Why / How It Happened */}
                <article className="rounded-lg bg-[#0F172A] p-4">
                  <h5 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    Why / How It Happened?
                  </h5>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    {prescriptive?.why ?? "-"}
                  </p>
                </article>
              </div>

              {/* Recommended Action */}
              <article className="mt-4 rounded-lg bg-[#0F172A] p-4">
                <h5 className="text-sm font-semibold text-white">
                  Recommended Action
                </h5>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-300">
                  {prescriptive?.recommendedAction ?? "-"}
                </p>
              </article>
            </section>
          </div>
          <DialogFooter className="border-t border-white/10 px-6 py-4">
            <DialogClose asChild>
              <Button className="rounded-md">Close</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
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

  root.render(<ModelModal {...options} />);
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
