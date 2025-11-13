"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProductDataRow = {
  lot: string;
  status: string;
  activeMachineId?: string;
  averages?: Record<string, number> | null;
  operationHour?: number | null;
  goodProduct?: number | null;
  defectProduct?: number | null;
  conclusion?: string | null;
  isConclusion?: boolean | null;
  updatedAt?: string;
};

type ProductDataViewerModalProps = {
  isOpen: boolean;
  // name the prop with an Action suffix so it's recognized as an action by the
  // Next.js client serialization rule. Callers should pass `onCloseAction`.
  onCloseAction: () => void;
};

type ProductsResponse = {
  products?: ProductDataRow[];
};

const statusVisuals: Record<string, string> = {
  completed:
    "bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/40",
  processing:
    "bg-amber-500/20 text-amber-200 ring-1 ring-inset ring-amber-400/40",
  default: "bg-slate-700/40 text-slate-200 ring-1 ring-inset ring-slate-600/60",
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value?: number | null, fractionDigits = 2) => {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const renderAverageValue = (value: unknown) => {
  if (typeof value === "number") {
    return formatNumber(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? formatNumber(parsed) : value;
  }
  return "-";
};

export default function ProductDataViewerModal({
  isOpen,
  onCloseAction,
}: ProductDataViewerModalProps) {
  const [products, setProducts] = useState<ProductDataRow[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConclusionModal, setShowConclusionModal] = useState(false);
  const [conclusionLot, setConclusionLot] = useState<string | null>(null);
  const [conclusionText, setConclusionText] = useState<string>("");
  const [isSubmittingConclusion, setSubmittingConclusion] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationLot, setValidationLot] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [deletingLot, setDeletingLot] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/products"), {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Gagal memuat data produk dari MySQL"
        );
      }
      const json = (await response.json()) as ProductsResponse;
      const list = Array.isArray(json?.products) ? json.products : [];
      setProducts(list);

      // Jika ada product yang status completed tetapi isConclusion === false, tampilkan modal konklusi
      const pendingConclusion = list.find(
        (p) => (p.status ?? "").toLowerCase() === "completed" && !p.isConclusion
      );
      if (pendingConclusion) {
        setConclusionLot(pendingConclusion.lot);
        setConclusionText(pendingConclusion.conclusion ?? "");
        // show the conclusion modal and also show a validation modal so the user
        // can validate the lot/product data before acknowledging
        setShowConclusionModal(true);
        setValidationLot(pendingConclusion.lot);
        setShowValidationModal(true);
      } else {
        setShowConclusionModal(false);
        setConclusionLot(null);
        setConclusionText("");
      }
    } catch (err) {
      console.error("Failed to load product data", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadProducts();
  }, [isOpen, loadProducts]);

  const submitConclusion = useCallback(async () => {
    if (!conclusionLot) return;
    setSubmittingConclusion(true);
    try {
      const resp = await fetch(apiUrl("/api/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotNumber: conclusionLot,
          conclusion: conclusionText,
          isConclusion: true,
        }),
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(
          payload?.error || resp.statusText || "Gagal menyimpan konklusi"
        );
      }
      // berhasil, reload produk dan tutup modal
      await loadProducts();
      setShowConclusionModal(false);
      setConclusionLot(null);
      setConclusionText("");
    } catch (err) {
      console.error("Failed to submit conclusion", err);
      // keep modal open and show console error; could show UI error later
    } finally {
      setSubmittingConclusion(false);
    }
  }, [conclusionLot, conclusionText, loadProducts]);

  const handleValidateConfirm = useCallback(async () => {
    // Mark as validated and reuse the submitConclusion flow to set isConclusion
    if (!conclusionLot) return;
    setIsValidating(true);
    try {
      // reuse existing submit flow: submit the current conclusionText and mark isConclusion
      await submitConclusion();
      // close validation modal as well
      setShowValidationModal(false);
    } catch (err) {
      console.error("Failed to validate/acknowledge conclusion", err);
      // keep modal open on error
    } finally {
      setIsValidating(false);
    }
  }, [conclusionLot, submitConclusion]);

  const handleValidateReject = useCallback(() => {
    // User indicated the data is not correct. Close validation modal and keep
    // conclusion modal open so user can inspect or take other actions.
    setShowValidationModal(false);
    alert(
      "Data ditandai tidak sesuai. Silakan koreksi data di sumber atau hubungi administrator."
    );
  }, []);

  const deleteLot = useCallback(
    async (lot: string) => {
      if (!lot) return;
      if (
        !confirm(
          `Yakin ingin menghapus lot ${lot}? Tindakan ini tidak dapat dikembalikan.`
        )
      ) {
        return;
      }
      setDeletingLot(lot);
      try {
        const resp = await fetch(
          apiUrl(`/api/products/${encodeURIComponent(lot)}`),
          {
            method: "DELETE",
          }
        );

        if (resp.status === 204 || resp.ok) {
          // refresh list
          await loadProducts();
        } else {
          const payload = await resp.json().catch(() => ({}));
          throw new Error(
            payload?.error || resp.statusText || "Gagal menghapus lot"
          );
        }
      } catch (err) {
        console.error("Failed to delete lot", err);
        alert(err instanceof Error ? err.message : "Gagal menghapus lot");
      } finally {
        setDeletingLot(null);
      }
    },
    [loadProducts]
  );

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [products]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onCloseAction?.();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border border-slate-800 bg-slate-950/95 p-0 text-slate-100">
          <DialogHeader className="border-b border-slate-800 px-6 py-5">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Data Produk
            </span>
            <DialogTitle className="text-xl font-semibold text-white">
              Ringkasan Produk dari MySQL
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Data berasal dari endpoint backend <code>/api/products</code> yang
              terhubung ke MySQL.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-400">
                {isLoading
                  ? "Memuat data produk..."
                  : `Total produk: ${sortedProducts.length}`}
              </div>
              <div className="flex items-center gap-2">
                {error && (
                  <span className="text-xs text-rose-400">{error}</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProducts}
                  disabled={isLoading}
                >
                  {isLoading ? "Memuat..." : "Refresh"}
                </Button>
              </div>
            </div>
            <div className="relative flex-1 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-900/60">
              {sortedProducts.length === 0 && !isLoading ? (
                <div className="flex h-full items-center justify-center p-10 text-sm text-slate-400">
                  {error
                    ? "Tidak ada data untuk ditampilkan."
                    : "Belum ada produk."}
                </div>
              ) : (
                <table className="min-w-full table-fixed border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-900/80 backdrop-blur">
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-4 py-3 font-semibold">Lot</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">
                        Active Machine
                      </th>
                      <th className="px-4 py-3 font-semibold">Jam Operasi</th>
                      <th className="px-4 py-3 font-semibold">Produk Bagus</th>
                      <th className="px-4 py-3 font-semibold">Produk Cacat</th>
                      <th className="px-4 py-3 font-semibold">Kesimpulan</th>
                      <th className="px-4 py-3 font-semibold">
                        Rata-rata Sensor
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Update Terakhir
                      </th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((product) => {
                      const status = product.status?.toLowerCase() ?? "default";
                      const badgeClass =
                        statusVisuals[status] ?? statusVisuals.default;
                      const averages = product.averages ?? {};
                      const averageEntries = Object.entries(averages);
                      return (
                        <tr
                          key={`${product.lot}-${product.updatedAt ?? "na"}`}
                          className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3 font-semibold text-white">
                            {product.lot ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                            >
                              {product.status ?? "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {product.activeMachineId ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {formatNumber(product.operationHour)}
                          </td>
                          <td className="px-4 py-3 text-emerald-300">
                            {formatNumber(product.goodProduct, 0)}
                          </td>
                          <td className="px-4 py-3 text-rose-300">
                            {formatNumber(product.defectProduct, 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            {product.conclusion?.trim() ? (
                              <span className="line-clamp-2 text-xs leading-relaxed text-slate-300">
                                {product.conclusion}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {averageEntries.length ? (
                              <div className="flex flex-wrap gap-1">
                                {averageEntries.map(([key, value]) => (
                                  <Badge
                                    key={`${product.lot}-${key}`}
                                    variant="secondary"
                                    className="rounded-full bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-200"
                                  >
                                    {key}: {renderAverageValue(value)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {formatDateTime(product.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteLot(product.lot)}
                                disabled={
                                  deletingLot === product.lot || isLoading
                                }
                              >
                                {deletingLot === product.lot
                                  ? "Menghapus..."
                                  : "Hapus"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <DialogFooter className="border-t border-slate-800 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => onCloseAction?.()}
              className="px-4"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation modal shown after conclusion modal to let user validate lot/product data */}
      <Dialog
        open={showValidationModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowValidationModal(false);
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-slate-800 bg-slate-900 p-0 text-white">
          <DialogHeader className="border-b border-slate-800 px-6 py-5">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Validasi Data
            </span>
            <DialogTitle className="text-lg font-semibold text-white">
              Lot {validationLot}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Periksa ringkasan data untuk lot ini. Tandai "Data Sesuai" jika
              semua nilai terlihat benar, atau "Data Tidak Sesuai" bila ada
              ketidaksesuaian.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 py-6">
            {validationLot ? (
              (() => {
                const product = products.find((p) => p.lot === validationLot);
                const operationHour = product?.operationHour ?? null;
                const averages = product?.averages ?? {};
                const energyKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("energy") ||
                    k.toLowerCase().includes("energy_usage")
                );
                const tempKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("temperature") ||
                    k.toLowerCase().includes("temp")
                );
                const energyValue = energyKey ? averages[energyKey] : undefined;
                const tempValue = tempKey ? averages[tempKey] : undefined;

                return (
                  <div className="flex flex-col gap-4 text-sm text-slate-200">
                    <div>
                      <div className="text-xs text-slate-400">Jam Operasi</div>
                      <div className="mt-1 text-lg font-semibold">
                        {operationHour !== null &&
                        typeof operationHour !== "undefined"
                          ? formatNumber(operationHour, 2)
                          : 2}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Produk Bagus</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-300">
                        {formatNumber(product?.goodProduct, 16)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Produk Cacat</div>
                      <div className="mt-1 text-lg font-semibold text-rose-300">
                        {formatNumber(product?.defectProduct, 4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Energy Usage</div>
                      <div className="mt-1 text-lg font-semibold">
                        {typeof energyValue === "number"
                          ? formatNumber(energyValue, 2)
                          : typeof energyValue === "string"
                          ? energyValue
                          : "4 kwh"}
                      </div>
                      {energyKey && (
                        <div className="text-xs text-slate-500 mt-1">
                          Key: {energyKey}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Average Temp</div>
                      <div className="mt-1 text-lg font-semibold">
                        {typeof tempValue === "number"
                          ? formatNumber(tempValue, 2)
                          : typeof tempValue === "string"
                          ? tempValue
                          : "335"}
                      </div>
                      {tempKey && (
                        <div className="text-xs text-slate-500 mt-1">
                          Key: {tempKey}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Kesimpulan</div>
                      <div className="mt-1 text-sm text-slate-300">
                        {product?.conclusion ?? "-"}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-slate-400">Tidak ada lot yang dipilih.</div>
            )}
          </div>
          <DialogFooter className="border-t border-slate-800 px-6 py-4">
            <Button
              variant="outline"
              className="bg-slate-800/60 text-slate-200"
              onClick={() => setShowValidationModal(false)}
              disabled={isValidating}
            >
              Tutup
            </Button>
            <Button
              variant="outline"
              className="bg-rose-700 text-white"
              onClick={handleValidateReject}
              disabled={isValidating}
            >
              Data Tidak Sesuai
            </Button>
            <Button
              variant="outline"
              className="bg-blue-500 text-white"
              onClick={handleValidateConfirm}
              disabled={isValidating}
            >
              {isValidating ? "Memvalidasi..." : "Data Sesuai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conclusion modal shown when completed product has not been acknowledged */}
      <Dialog
        open={showConclusionModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowConclusionModal(false);
            setConclusionLot(null);
            setConclusionText("");
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-slate-800 bg-slate-900 p-0 text-white">
          <DialogHeader className="border-b border-slate-800 px-6 py-5">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Konklusi Produk
            </span>
            <DialogTitle className="text-lg font-semibold text-white">
              Lot {conclusionLot}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan kesimpulan untuk lot ini. Setelah disimpan, modal ini
              tidak akan muncul lagi untuk lot yang sama.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 py-6">
            {/* Read-only summary: operation hour, energy usage, average temperature */}
            {conclusionLot ? (
              (() => {
                const product = products.find((p) => p.lot === conclusionLot);
                const operationHour = product?.operationHour ?? null;
                const averages = product?.averages ?? {};
                // Common keys for energy and temperature
                const energyKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("energy") ||
                    k.toLowerCase().includes("energy_usage")
                );
                const tempKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("temperature") ||
                    k.toLowerCase().includes("temp")
                );
                const energyValue = energyKey ? averages[energyKey] : undefined;
                const tempValue = tempKey ? averages[tempKey] : undefined;

                return (
                  <div className="flex flex-col gap-4 text-sm text-slate-200">
                    <div>
                      <div className="text-xs text-slate-400">Jam Operasi</div>
                      <div className="mt-1 text-lg font-semibold">
                        {operationHour !== null &&
                        typeof operationHour !== "undefined"
                          ? formatNumber(operationHour, 2)
                          : "2"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Energy Usage</div>
                      <div className="mt-1 text-lg font-semibold">
                        {typeof energyValue === "number"
                          ? formatNumber(energyValue, 2)
                          : typeof energyValue === "string"
                          ? energyValue
                          : "4 kwh"}
                      </div>
                      {energyKey && (
                        <div className="text-xs text-slate-500 mt-1">
                          Key: {energyKey}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">
                        Average Temperature
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {typeof tempValue === "number"
                          ? formatNumber(tempValue, 2)
                          : typeof tempValue === "string"
                          ? tempValue
                          : "335"}
                      </div>
                      {tempKey && (
                        <div className="text-xs text-slate-500 mt-1">
                          Key: {tempKey}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Data diambil dari rata-rata sensor dan jam operasi
                      terakhir yang tercatat untuk lot ini.
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-slate-400">Tidak ada lot yang dipilih.</div>
            )}
          </div>
          <DialogFooter className="border-t border-slate-800 px-6 py-4">
            <Button
              variant="outline"
              className="bg-slate-800/60 text-slate-200"
              onClick={() => {
                setShowConclusionModal(false);
                setConclusionLot(null);
                setConclusionText("");
              }}
              disabled={isSubmittingConclusion}
            >
              Batal
            </Button>
            <Button
              variant="outline"
              className="bg-blue-500 text-white"
              onClick={async () => {
                // Generate a concise conclusion string from the displayed values
                if (!conclusionLot) return;
                const product = products.find((p) => p.lot === conclusionLot);
                const operationHour = product?.operationHour ?? null;
                const averages = product?.averages ?? {};
                const energyKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("energy") ||
                    k.toLowerCase().includes("energy_usage")
                );
                const tempKey = Object.keys(averages).find(
                  (k) =>
                    k.toLowerCase().includes("temperature") ||
                    k.toLowerCase().includes("temp")
                );
                const energyValue = energyKey ? averages[energyKey] : undefined;
                const tempValue = tempKey ? averages[tempKey] : undefined;

                const opStr =
                  operationHour !== null && typeof operationHour !== "undefined"
                    ? `${formatNumber(operationHour, 2)} h`
                    : "-";
                const energyStr =
                  typeof energyValue === "number"
                    ? `${formatNumber(energyValue, 2)} kWh`
                    : typeof energyValue === "string"
                    ? energyValue
                    : "-";
                const tempStr =
                  typeof tempValue === "number"
                    ? `${formatNumber(tempValue, 2)} °C`
                    : typeof tempValue === "string"
                    ? tempValue
                    : "-";

                const generated = `Jam Operasi: ${opStr}; Energy Usage: ${energyStr}; Avg Temp: ${tempStr}`;
                setSubmittingConclusion(true);
                try {
                  const resp = await fetch(apiUrl("/api/products"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      lotNumber: conclusionLot,
                      conclusion: generated,
                      isConclusion: true,
                    }),
                  });
                  if (!resp.ok) {
                    const payload = await resp.json().catch(() => ({}));
                    throw new Error(
                      payload?.error ||
                        resp.statusText ||
                        "Gagal menyimpan konklusi"
                    );
                  }
                  // success
                  await loadProducts();
                  setShowConclusionModal(false);
                  setConclusionLot(null);
                  setConclusionText("");
                } catch (err) {
                  console.error("Failed to submit conclusion", err);
                } finally {
                  setSubmittingConclusion(false);
                }
              }}
              disabled={!conclusionLot || isSubmittingConclusion}
            >
              {isSubmittingConclusion ? "Menyimpan..." : "Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
