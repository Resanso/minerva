"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { apiUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProductDataResponse = {
  lot: string;
  status: string;
  activeMachineId: string;
  averages: Record<string, number>;
  operationHour: number;
  goodProduct: number;
  defectProduct: number;
  conclusion: string;
  isConclusion?: boolean;
  updatedAt: string;
};

type ProductDataModalProps = {
  isOpen: boolean;
  // name with Action suffix so Next.js client serialization accepts it
  onCloseAction: () => void;
  onSuccess?: (payload: ProductDataResponse) => void;
};

export default function ProductDataModal({
  isOpen,
  onCloseAction,
  onSuccess,
}: ProductDataModalProps) {
  const [lotNumber, setLotNumber] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = lotNumber.trim().length > 0;

  const resetForm = useCallback(() => {
    setLotNumber("");
    setError(null);
    setSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lotNumber: lotNumber.trim(),
        }),
      });

      if (!response.ok) {
        const message = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(
          typeof message?.error === "string"
            ? message.error
            : "Gagal menyimpan data produk"
        );
      }

      const json = (await response.json()) as ProductDataResponse;
      onSuccess?.(json);
      resetForm();
      onCloseAction();
    } catch (err) {
      console.error("Failed to submit product data", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data produk"
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, isSubmitting, lotNumber, onCloseAction, onSuccess, resetForm]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCloseAction();
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border border-slate-800 bg-slate-900 p-0 text-white">
        <DialogHeader className="border-b border-slate-800 px-6 py-5">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Tambah Data Produk
          </span>
          <DialogTitle className="text-xl font-semibold text-white">
            Simpan Data Manual ke MySQL
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Masukkan nomor lot; sistem backend akan melengkapi data produk
            secara otomatis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section className="space-y-3">
            <div className="space-y-2">
              <label
                htmlFor="lot-number"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Nomor Lot<span className="ml-2 text-rose-400">*</span>
              </label>
              <Input
                id="lot-number"
                required
                placeholder="cth. LOT-2025-001"
                value={lotNumber}
                onChange={(event) => setLotNumber(event.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Sistem backend akan mengisi detail mesin, performa, dan metrik
              berdasarkan nomor lot ini.
            </p>
          </section>

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="border-t border-slate-800 px-6 py-4">
          <Button
            variant="flat"
            className="bg-slate-800/60 text-slate-200"
            onPress={onCloseAction}
            isDisabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            color="primary"
            className="bg-blue-500 text-white"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!canSubmit}
          >
            Simpan Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
