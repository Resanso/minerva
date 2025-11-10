"use client";

import { useCallback, useMemo } from "react";
import {
  useSimulation,
  type SimulationVariant,
} from "@/components/simulation/SimulationProvider";

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

  const handleToggleSimulation = useCallback(() => {
    if (isSimulationMode) {
      stopSimulation();
      return;
    }
    setSimulationVariant("sequence");
    requestSimulationStart();
  }, [
    isSimulationMode,
    requestSimulationStart,
    stopSimulation,
    setSimulationVariant,
  ]);

  const handleVariantClick = useCallback(
    (variant: SimulationVariant) => {
      setSimulationVariant(variant);
    },
    [setSimulationVariant]
  );

  const handleMonitoringModeClick = useCallback(() => {
    setSimulationVariant("realtime");
  }, [setSimulationVariant]);

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
        ? "Memantau status mesin dari data realtime (dummy JSON)"
        : "Gunakan data realtime dummy untuk highlight mesin aktif.";
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

  const buttonLabel = isSimulationMode
    ? "Keluar Simulasi"
    : isRealtime
    ? "Mulai Realtime"
    : "Jalankan Simulasi";
  const isStartDisabled =
    !isSimulationMode && simulationVariant === "sequence" && flowsLoading;
  const buttonClasses = isSimulationMode
    ? "inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : isRealtime
    ? "inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/5 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : "inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
  const monitoringButtonClasses = isRealtime
    ? "inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    : "inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/5 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

  return (
    <footer className="fixed bottom-4 bg-transparent left-1/2 z-50 w-[min(100%-2rem,48rem)] -translate-x-1/2 rounded-3xl px-6 py-4 text-slate-200">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {isSimulationMode && (
              <div className="flex items-center gap-1 rounded-full bg-slate-800/60 p-1 text-xs font-semibold text-slate-300 shadow-inner">
                {(
                  [
                    { value: "sequence", label: "Simulasi Biasa" },
                    { value: "realtime", label: "Simulasi Realtime" },
                  ] as const
                ).map((option) => {
                  const isActive = simulationVariant === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleVariantClick(option.value)}
                      className={`rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
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
              <button
                type="button"
                onClick={handleMonitoringModeClick}
                className={monitoringButtonClasses}
              >
                Monitoring mode
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleSimulation}
              className={buttonClasses}
              disabled={isStartDisabled}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
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
    </footer>
  );
}

export default BottomBar;
