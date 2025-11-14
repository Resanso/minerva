"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Icons intentionally omitted to avoid adding extra runtime deps. We use
// lightweight emoji placeholders instead.
import type { RealtimeResult } from "./SimulationProvider";

type RealEntry = {
  lot?: string;
  status?: string;
  averages?: Record<string, number | string> | null;
  operationHour?: number | string | null;
  goodProduct?: number | string | null;
  defectProduct?: number | string | null;
  conclusion?: string | null;
};

type Props = {
  isOpen: boolean;
  simResult: RealtimeResult | null;
  real?: RealEntry | null;
  onCloseAction: () => void;
};

// Komponen kecil untuk baris perbandingan agar kode lebih bersih
const ComparisonRow = ({
  label,
  icon,
  simVal,
  realVal,
  unit = "",
}: {
  label: string;
  icon: React.ReactNode;
  simVal: string | number;
  realVal: string | number;
  unit?: string;
}) => {
  const sVal =
    typeof simVal === "number" ? simVal : parseFloat(String(simVal)) || 0;
  const rVal =
    typeof realVal === "number" ? realVal : parseFloat(String(realVal)) || 0;
  const diff = Math.round((sVal - rVal) * 100) / 100;
  const isDiff = diff !== 0;

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-3 border-b last:border-0 hover:bg-muted/30 transition-colors px-2 rounded-md">
      {/* Label Column */}
      <div className="col-span-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="inline-flex w-4 h-4 items-center justify-center text-sm">
          {icon}
        </span>
        {label}
      </div>

      {/* Sim Value */}
      <div className="col-span-3 text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
        {simVal}{" "}
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>

      {/* Real Value */}
      <div className="col-span-3 text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        {realVal}{" "}
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>

      {/* Delta / Diff */}
      <div className="col-span-2 flex justify-end">
        {isDiff ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 h-5 font-mono border-orange-200 bg-orange-50 text-slate-700 dark:bg-orange-900/20 dark:text-orange-400"
          >
            {diff > 0 ? `+${diff}` : diff}
          </Badge>
        ) : (
          <span className="text-xs text-black opacity-90">-</span>
        )}
      </div>
    </div>
  );
};

export default function AutonomousResultModal({
  isOpen,
  simResult,
  real = null,
  onCloseAction,
}: Props) {
  if (!simResult) return null;

  // Data Prep
  const simTemp = simResult.averages?.temperature ?? 0;
  const simOp = simResult.operationHour ?? 0;
  const simGood = simResult.goodProduct ?? 0;
  const simDef = simResult.defectProduct ?? 0;

  const realTemp = real?.averages?.temperature ?? 0;
  const realOp = real?.operationHour ?? 0;
  const realGood = real?.goodProduct ?? 0;
  const realDef = real?.defectProduct ?? 0;

  // Logic Conclusion sederhana
  const tempDiff = Math.abs(Number(simTemp) - Number(realTemp)).toFixed(1);
  const matchPercentage =
    realGood && simGood
      ? Math.min(100, (Number(realGood) / Number(simGood)) * 100).toFixed(1)
      : "0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-muted/10">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="w-5 h-5 text-primary">↔️</span>
            Autonomous Verification
          </DialogTitle>
          <DialogDescription>
            Comparing Digital Twin simulation against real sensor data.
          </DialogDescription>
        </DialogHeader>

        {/* Header Grid Table */}
        <div className="px-6 py-2 bg-muted/30 border-y grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Metric</div>
          <div className="col-span-3 text-right text-blue-600 dark:text-blue-400">
            Simulation
          </div>
          <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400">
            Real Sensor
          </div>
          <div className="col-span-2 text-right">Delta</div>
        </div>

        <div className="p-6 pt-2 space-y-1">
          <ComparisonRow
            label="Temperature"
            icon={"🌡️"}
            simVal={simTemp}
            realVal={realTemp}
            unit="°C"
          />
          <ComparisonRow
            label="Op. Duration"
            icon={"⏱️"}
            simVal={simOp}
            realVal={realOp}
            unit="h"
          />
          <ComparisonRow
            label="Good Items"
            icon={"📦"}
            simVal={simGood}
            realVal={realGood}
            unit="pcs"
          />
          <ComparisonRow
            label="Defects"
            icon={"⚠️"}
            simVal={simDef}
            realVal={realDef}
            unit="pcs"
          />
        </div>

        {/* Conclusion Box */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex items-start gap-3">
            <span className="w-5 h-5 text-blue-600 mt-0.5 shrink-0">⚡</span>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Analysis Summary
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                The simulation shows a{" "}
                <span className="font-bold">{matchPercentage}%</span> match with
                real production output. Temperature deviation is{" "}
                <span className="font-mono">{tempDiff}°C</span>.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button
            onClick={onCloseAction}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Close Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
