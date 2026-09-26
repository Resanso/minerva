"use client";

import { useMemo } from "react";
import { useSensorStream } from "@/components/simulation/useSensorStream";

const formatValue = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1000) {
    return value.toFixed(0);
  }
  return value.toFixed(1);
};

export default function LiveSensorTicker() {
  const { readings, connected } = useSensorStream({ limit: 8 });
  const topReadings = useMemo(() => readings.slice(0, 4), [readings]);

  return (
    <div className="hidden max-w-sm items-center gap-3 overflow-hidden rounded-full border border-[#3c4043] bg-[#303134] px-3 py-1.5 text-xs text-[#e8eaed] lg:flex">
      <span className="flex items-center gap-1 font-medium">
        <span
          className={`${
            connected ? "bg-[#81c995] animate-pulse" : "bg-slate-600"
          } inline-flex h-2 w-2 rounded-full`}
        />
        <span className={connected ? "text-[#81c995]" : "text-[#9aa0a6]"}>
          Influx Stream
        </span>
      </span>
      {topReadings.length === 0 ? (
        <span className="text-[#9aa0a6]">Menunggu data sensor...</span>
      ) : (
        topReadings.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 whitespace-nowrap text-[#bdc1c6]"
          >
            <span className="font-medium text-[#e8eaed]">
              {item.machineName}
            </span>
            <span className="text-[#9aa0a6]">·</span>
            <span>{item.sensorName}</span>
            <span className="text-[#9aa0a6]">=</span>
            <span className="font-medium text-white">
              {formatValue(item.value)}
            </span>
          </span>
        ))
      )}
    </div>
  );
}
