"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { apiUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  updatedAt: string;
};

type ProductDataModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payload: ProductDataResponse) => void;
};

type AverageRow = {
  id: string;
  key: string;
  value: string;
};

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `avg-${Math.random().toString(36).slice(2, 10)}`;
};

const createEmptyAverageRow = (): AverageRow => ({
  id: createId(),
  key: "",
  value: "",
});

const normalizeNumber = (value: string): number | null => {
  const trimmed = value.trim().replace(/,/g, ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ProductDataModal({
  isOpen,
  onClose,
  onSuccess,
}: ProductDataModalProps) {
  const [lotNumber, setLotNumber] = useState("");
  const [machineName, setMachineName] = useState("");
  const [activeMachineId, setActiveMachineId] = useState("");
  const [operationHour, setOperationHour] = useState("");
  const [goodProduct, setGoodProduct] = useState("");
  const [defectProduct, setDefectProduct] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [averageRows, setAverageRows] = useState<AverageRow[]>([
    createEmptyAverageRow(),
  ]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => lotNumber.trim().length > 0, [lotNumber]);

  const handleAddAverageRow = useCallback(() => {
    setAverageRows((prev) => [...prev, createEmptyAverageRow()]);
  }, []);

  const handleAverageChange = useCallback(
    (id: string, field: "key" | "value", value: string) => {
      setAverageRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                [field]: value,
              }
            : row
        )
      );
    },
    []
  );

  const handleRemoveAverage = useCallback((id: string) => {
    setAverageRows((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((row) => row.id !== id);
    });
  }, []);

  const resetForm = useCallback(() => {
    setLotNumber("");
    setMachineName("");
    setActiveMachineId("");
    setOperationHour("");
    setGoodProduct("");
    setDefectProduct("");
    setConclusion("");
    setAverageRows([createEmptyAverageRow()]);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const payloadAverages = useMemo(() => {
    const entries = averageRows
      .map((row) => ({ key: row.key.trim(), value: row.value.trim() }))
      .filter((row) => row.key.length > 0 && row.value.length > 0);
    if (entries.length === 0) return undefined;
    return entries.reduce<Record<string, number | string>>((acc, entry) => {
      const numeric = normalizeNumber(entry.value);
      acc[entry.key] = numeric ?? entry.value;
      return acc;
    }, {});
  }, [averageRows]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const goodProductNumber = normalizeNumber(goodProduct);
      const defectProductNumber = normalizeNumber(defectProduct);
      const operationHourNumber = normalizeNumber(operationHour);

      const response = await fetch(apiUrl("/api/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lotNumber: lotNumber.trim(),
          machineName: machineName.trim(),
          activeMachineId: activeMachineId.trim() || undefined,
          averages: payloadAverages,
          operationHour:
            operationHourNumber?.toString() ??
            (operationHour.trim() || undefined),
          goodProduct: goodProductNumber ?? undefined,
          defectProduct: defectProductNumber ?? undefined,
          conclusion: conclusion.trim() || undefined,
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
      onClose();
    } catch (err) {
      console.error("Failed to submit product data", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data produk"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    activeMachineId,
    canSubmit,
    conclusion,
    defectProduct,
    goodProduct,
    isSubmitting,
    lotNumber,
    machineName,
    onClose,
    onSuccess,
    operationHour,
    payloadAverages,
    resetForm,
  ]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
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
            Lengkapi detail lot dan performa mesin untuk diteruskan ke backend.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <label
                htmlFor="machine-name"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Nama Mesin
              </label>
              <Input
                id="machine-name"
                placeholder="cth. Line-Alpha"
                value={machineName}
                onChange={(event) => setMachineName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="active-machine"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Active Machine ID
              </label>
              <Input
                id="active-machine"
                placeholder="cth. ALPHA-01"
                value={activeMachineId}
                onChange={(event) => setActiveMachineId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="operation-hour"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Jam Operasi
              </label>
              <Input
                id="operation-hour"
                placeholder="cth. 7.5"
                value={operationHour}
                onChange={(event) => setOperationHour(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="good-product"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Produk Bagus
              </label>
              <Input
                id="good-product"
                type="number"
                inputMode="numeric"
                placeholder="cth. 150"
                value={goodProduct}
                onChange={(event) => setGoodProduct(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="defect-product"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Produk Cacat
              </label>
              <Input
                id="defect-product"
                type="number"
                inputMode="numeric"
                placeholder="cth. 4"
                value={defectProduct}
                onChange={(event) => setDefectProduct(event.target.value)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Rata-rata Sensor
                </h4>
                <p className="text-xs text-slate-500">
                  Tambahkan pasangan metrik dan nilai. Kosongkan baris yang
                  tidak digunakan.
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                className="bg-slate-800/60 text-slate-200"
                onPress={handleAddAverageRow}
              >
                Tambah Baris
              </Button>
            </div>
            <div className="space-y-2">
              {averageRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor={`metric-${row.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                    >
                      {`Metrik ${index + 1}`}
                    </label>
                    <Input
                      id={`metric-${row.id}`}
                      placeholder="cth. temperature"
                      value={row.key}
                      onChange={(event) =>
                        handleAverageChange(row.id, "key", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`metric-value-${row.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                    >
                      Nilai
                    </label>
                    <Input
                      id={`metric-value-${row.id}`}
                      placeholder="cth. 72.4"
                      value={row.value}
                      onChange={(event) =>
                        handleAverageChange(row.id, "value", event.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-end justify-end pb-1">
                    <Button
                      size="sm"
                      variant="light"
                      className="text-slate-400 hover:text-rose-300"
                      onPress={() => handleRemoveAverage(row.id)}
                      isDisabled={averageRows.length <= 1}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="space-y-2">
              <label
                htmlFor="conclusion"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Catatan / Kesimpulan
              </label>
              <Textarea
                id="conclusion"
                rows={4}
                placeholder="Masukkan ringkasan analisis mesin"
                value={conclusion}
                onChange={(event) => setConclusion(event.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
          </section>
        </div>
        <DialogFooter className="border-t border-slate-800 px-6 py-4">
          <Button
            variant="flat"
            className="bg-slate-800/60 text-slate-200"
            onPress={onClose}
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
