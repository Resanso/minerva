"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Tambahkan Description untuk aksesibilitas
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { RealtimeResult } from "./SimulationProvider";
import SimulationValidationModal from "./SimulationValidationModal";

type Props = {
  isOpen: boolean;
  result: RealtimeResult | null;
  onCloseAction: () => void;
};

export default function SimulationResultModal({
  isOpen,
  result,
  onCloseAction,
}: Props) {
  const [isValidationOpen, setValidationOpen] = useState(false);
  if (!result) return null;

  // Helper untuk format angka agar rapi
  const formatValue = (
    val: string | number | null | undefined
  ): string | number => (val == null ? "-" : val);

  const temp = formatValue(result.averages?.temperature);
  const opHour = formatValue(result.operationHour);
  const good = formatValue(result.goodProduct);
  const defect = formatValue(result.defectProduct);
  const conclusion = result.conclusion ?? "No conclusion available.";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
        {/* max-w-lg agar modal sedikit lebih lebar dan lega */}
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="inline-block w-5 text-primary">📄</span>
              Simulation Report
            </DialogTitle>
            <DialogDescription>
              Summary of the production simulation performance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            {/* Temperature Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <span className="h-5 w-5 text-blue-600 dark:text-blue-400">
                    🌡️
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Avg. Temperature
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight">
                      {temp}
                    </span>
                    <span className="text-xs text-muted-foreground">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operation Hour Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                  <span className="h-5 w-5 text-orange-600 dark:text-orange-400">
                    ⏱️
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Operation Time
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight">
                      {opHour}
                    </span>
                    <span className="text-xs text-muted-foreground">Hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Good Product Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                  <span className="h-5 w-5 text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Good Products
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {good}
                    </span>
                    <span className="text-xs text-muted-foreground">Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Defect Product Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/30">
                  <span className="h-5 w-5 text-rose-600 dark:text-rose-400">
                    ⚠️
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Defects
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                      {defect}
                    </span>
                    <span className="text-xs text-muted-foreground">Units</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion Section */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold leading-none tracking-tight">
              Analysis Conclusion
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {conclusion}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex gap-2 w-full justify-end">
              <Button
                className="w-full sm:w-auto bg-slate-800"
                onClick={onCloseAction}
              >
                Close Report
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => setValidationOpen(true)}
              >
                validation
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SimulationValidationModal
        isOpen={isValidationOpen}
        initial={{
          temperature: result.averages?.temperature ?? null,
          operationHour: result.operationHour ?? null,
          goodProduct: result.goodProduct ?? null,
          defectProduct: result.defectProduct ?? null,
        }}
        onCloseAction={() => setValidationOpen(false)}
        onSubmitAction={(payload) => {
          // For now, simply log validated values and close the validation modal.
          // You can replace this with a save-to-backend call or other logic.
          try {
            console.debug("Validated simulation values:", payload);
          } catch (err) {
            /* ignore */
          }
          setValidationOpen(false);
        }}
      />
    </>
  );
}
