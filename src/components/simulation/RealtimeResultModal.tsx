"use client";

import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMemo } from "react";
import { useSimulation } from "./SimulationProvider";

const toTitleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatSensorValue = (value: number | string) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : "-";
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "-";
};

function metricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">
        {value}
        {suffix ? ` ${suffix}` : ""}
      </p>
    </div>
  );
}

export default function RealtimeResultModal() {
  const { realtimeResult, dismissRealtimeResult } = useSimulation();

  const sensorEntries = useMemo(() => {
    if (!realtimeResult) return [] as Array<[string, number | string]>;
    return Object.entries(realtimeResult.averages ?? {});
  }, [realtimeResult]);

  if (!realtimeResult) {
    return null;
  }

  const {
    lot,
    status,
    operationHour,
    goodProduct,
    defectProduct,
    conclusion,
    updatedAt,
  } = realtimeResult;

  const temperatureEntry = sensorEntries.find(
    ([key]) => key.toLowerCase() === "temperature"
  );

  const remainingSensors = sensorEntries.filter(
    ([key]) => key.toLowerCase() !== "temperature"
  );

  const handleClose = () => {
    dismissRealtimeResult();
  };

  return (
    <Modal
      isOpen
      size="lg"
      backdrop="blur"
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      classNames={{
        base: "bg-slate-900 text-white",
        closeButton: "text-slate-400 hover:text-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Simulation Results
              </span>
              <h3 className="text-xl font-semibold text-white">
                Lot {lot || "-"}
              </h3>
            </div>
            <Chip
              color={status === "finish" ? "success" : "warning"}
              variant="flat"
              className="rounded-full px-3 py-1 text-xs font-semibold"
            >
              {status === "finish" ? "Finished" : "On Process"}
            </Chip>
          </div>
          {updatedAt && (
            <p className="text-xs text-slate-500">Updated at {updatedAt}</p>
          )}
        </ModalHeader>
        <ModalBody className="space-y-6">
          <section className="grid gap-3 md:grid-cols-2">
            {temperatureEntry &&
              metricCard({
                label: "Temperature",
                value: formatSensorValue(temperatureEntry[1]),
                suffix:
                  typeof temperatureEntry[1] === "number"
                    ? "Celcius"
                    : undefined,
              })}
            {metricCard({
              label: "Operation Hour",
              value: operationHour ?? "-",
            })}
            {metricCard({
              label: "Good Product",
              value: goodProduct != null ? goodProduct.toLocaleString() : "-",
            })}
            {metricCard({
              label: "Product Defect",
              value:
                defectProduct != null ? defectProduct.toLocaleString() : "-",
            })}
          </section>

          {remainingSensors.length > 0 && (
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Average Sensor Data
                </h4>
                <p className="text-xs text-slate-500">
                  Ringkasan data rata-rata sensor selama simulasi.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {remainingSensors.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-800 bg-slate-800/30 p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {toTitleCase(key)}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatSensorValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Conclusion</h4>
            <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 text-sm leading-relaxed text-slate-200">
              {conclusion}
            </div>
          </section>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            className="bg-blue-500 text-white"
            onPress={handleClose}
          >
            Ok
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
