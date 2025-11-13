"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useSimulation,
  type SimulationVariant,
} from "@/components/simulation/SimulationProvider";
import ProductDataModal, {
  type ProductDataResponse,
} from "@/components/ProductDataModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

function BottomBar() {
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [productSuccessMessage, setProductSuccessMessage] = useState<
    string | null
  >(null);

  const {
    isSimulationMode,
    simulationVariant,
    setSimulationVariant,
    stopSimulation,
    requestSimulationStart,
    activeMachine,
    steps,
    activeMachineId,
    stepProgress,
    elapsedSeconds,
    flowsLoading,
    flowsError,
    selectedProduct,
  } = useSimulation();

  const isRealtime = simulationVariant === "realtime";

  const progressPercent = useMemo(() => {
    if (!isSimulationMode) return 0;
    if (isRealtime) return activeMachine ? 100 : 0;
    if (!Number.isFinite(stepProgress)) return 0;
    return Math.max(0, Math.min(100, Math.round(stepProgress * 100)));
  }, [activeMachine, isRealtime, isSimulationMode, stepProgress]);

  const nextMachine = useMemo(() => {
    if (isRealtime || !activeMachineId) return null;
    const currentIndex = steps.findIndex((step) => step.id === activeMachineId);
    if (currentIndex < 0) return null;
    const nextIndex = (currentIndex + 1) % steps.length;
    return steps[nextIndex];
  }, [activeMachineId, isRealtime, steps]);

  const handleVariantClick = useCallback(
    (variant: SimulationVariant) => {
      setSimulationVariant(variant);
    },
    [setSimulationVariant]
  );

  const handleModeSwitchChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        if (!isSimulationMode) {
          setSimulationVariant("sequence");
          requestSimulationStart();
        }
        return;
      }

      if (isSimulationMode) {
        stopSimulation();
      }
      setSimulationVariant("realtime");
    },
    [
      isSimulationMode,
      requestSimulationStart,
      setSimulationVariant,
      stopSimulation,
    ]
  );

  const handleProductModalSuccess = useCallback(
    (payload: ProductDataResponse) => {
      setProductModalOpen(false);
      setProductSuccessMessage(
        `Data produk ${payload.lot} berhasil disimpan ke backend.`
      );
    },
    []
  );

  useEffect(() => {
    if (!productSuccessMessage) return;
    const timeout = window.setTimeout(() => {
      setProductSuccessMessage(null);
    }, 6000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [productSuccessMessage]);

  const statusLabel = useMemo(() => {
    const productName = selectedProduct?.productName;
    const baseFlowLabel = flowsLoading
      ? "Memuat flow produk"
      : productName ?? "Default sequence";
    if (isSimulationMode) {
      if (isRealtime) {
        return activeMachine?.name ?? "Menunggu sinyal realtime";
      }
      return activeMachine?.name ?? `Simulasi • ${baseFlowLabel}`;
    }
    return isRealtime ? "Mode realtime siap dijalankan" : baseFlowLabel;
  }, [
    activeMachine,
    flowsLoading,
    isRealtime,
    isSimulationMode,
    selectedProduct,
  ]);

  const subStatusLabel = useMemo(() => {
    if (isRealtime) {
      return isSimulationMode
        ? "Memantau status mesin dari stream InfluxDB."
        : "Gunakan mode realtime untuk menyoroti mesin dari stream InfluxDB.";
    }
    if (!isSimulationMode) {
      if (flowsLoading) {
        return "Memuat konfigurasi flow simulasi...";
      }
      if (flowsError) {
        return flowsError;
      }
      return selectedProduct?.description
        ? selectedProduct.description
        : `${steps.length} mesin akan diikutsertakan.`;
    }
    return nextMachine
      ? `Berikutnya: ${nextMachine.name}`
      : "Memuat urutan produksi dummy";
  }, [
    flowsError,
    flowsLoading,
    isRealtime,
    isSimulationMode,
    nextMachine,
    selectedProduct,
    steps.length,
  ]);

  const progressLabel = useMemo(() => {
    if (isRealtime) {
      return activeMachine ? "Live" : "Idle";
    }
    return `${progressPercent}%`;
  }, [activeMachine, isRealtime, progressPercent]);

  const isModeSwitchDisabled =
    !isSimulationMode && simulationVariant === "sequence" && flowsLoading;

  const baseModeButtonClass =
    "h-8 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition disabled:opacity-50 disabled:pointer-events-none";
  const monitoringButtonClass = cn(
    baseModeButtonClass,
    !isSimulationMode
      ? "bg-blue-500/20 text-white hover:bg-blue-500/25"
      : "bg-transparent text-slate-300 hover:bg-slate-700/40 hover:text-white"
  );
  const simulationButtonClass = cn(
    baseModeButtonClass,
    isSimulationMode
      ? "bg-blue-500/20 text-white hover:bg-blue-500/25"
      : "bg-transparent text-slate-300 hover:bg-slate-700/40 hover:text-white"
  );

  return (
    <footer className="fixed bottom-4 bg-transparent left-1/2 z-50 w-[min(100%-2rem,48rem)] -translate-x-1/2 rounded-3xl px-6 py-4 text-slate-200">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-slate-800/60 p-1 shadow-inner">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleModeSwitchChange(false)}
                className={monitoringButtonClass}
              >
                Monitoring
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleModeSwitchChange(true)}
                disabled={isModeSwitchDisabled}
                className={simulationButtonClass}
              >
                Simulasi
              </Button>
            </div>
            {isSimulationMode && (
              <div className="flex items-center gap-2 rounded-full bg-slate-800/60 p-1 text-xs font-semibold text-slate-300 shadow-inner">
                {(
                  [{ value: "sequence", label: "Auto manufacture" }] as const
                ).map((option) => {
                  const isActive = simulationVariant === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => handleVariantClick(option.value)}
                      className={cn(
                        "h-8 rounded-full px-3 text-xs",
                        isActive
                          ? "bg-blue-500 text-white hover:bg-blue-400"
                          : "text-slate-300 hover:text-white"
                      )}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            )}
            {isSimulationMode && (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                {formatSeconds(elapsedSeconds)}
              </span>
            )}
            {!isSimulationMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductModalOpen(true)}
                className="rounded-full border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
              >
                Tambah data produk
              </Button>
            )}
          </div>
        </div>
        {productSuccessMessage && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-center text-xs font-medium text-emerald-200">
            {productSuccessMessage}
          </div>
        )}
        {isSimulationMode && (
          <div className="flex flex-col gap-1">
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="absolute inset-y-0 left-0 bg-blue-500 transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>
                {isRealtime
                  ? `Aktif (Realtime): ${activeMachine?.name ?? "-"}`
                  : `Aktif: ${activeMachine?.name ?? "-"}`}
              </span>
              <span>{progressLabel}</span>
            </div>
          </div>
        )}
      </div>
      <ProductDataModal
        isOpen={isProductModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={handleProductModalSuccess}
      />
    </footer>
  );
}

export default BottomBar;
