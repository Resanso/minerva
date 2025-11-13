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
    <div className="hidden max-w-sm items-center gap-3 overflow-hidden rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 shadow-[0_6px_24px_rgba(15,23,42,0.55)] lg:flex">
      <span className="flex items-center gap-1 font-semibold">
        <span
          className={`${
            connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
          } inline-flex h-2 w-2 rounded-full`}
        />
        <span className={connected ? "text-emerald-300" : "text-slate-400"}>
          Influx Stream
        </span>
      </span>
      {topReadings.length === 0 ? (
        <span className="text-slate-500">Menunggu data sensor...</span>
      ) : (
        topReadings.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 whitespace-nowrap text-slate-300"
          >
            <span className="font-semibold text-slate-100">
              {item.machineName}
            </span>
            <span className="text-slate-500">·</span>
            <span>{item.sensorName}</span>
            <span className="text-slate-500">=</span>
            <span className="font-medium text-white">
              {formatValue(item.value)}
            </span>
          </span>
        ))
      )}
    </div>
  );
}
