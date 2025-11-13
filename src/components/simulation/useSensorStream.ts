"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

type SensorEventPayload = {
  time?: string;
  machineName?: string;
  sensorName?: string;
  value?: number;
};

export type LiveSensorReading = {
  id: string;
  time: string;
  machineName: string;
  sensorName: string;
  value: number;
};

type UseSensorStreamOptions = {
  measurement?: string;
  machine?: string;
  sensor?: string;
  limit?: number;
  enabled?: boolean;
};

type UseSensorStreamResult = {
  readings: LiveSensorReading[];
  connected: boolean;
  error: string | null;
};

const DEFAULT_LIMIT = 32;

export function useSensorStream(
  options: UseSensorStreamOptions = {}
): UseSensorStreamResult {
  const {
    measurement,
    machine,
    sensor,
    enabled = true,
    limit: rawLimit,
  } = options;

  const limit = Math.max(1, rawLimit ?? DEFAULT_LIMIT);
  const [readings, setReadings] = useState<LiveSensorReading[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      setError(null);
      return () => {
        /* no-op */
      };
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (measurement) params.set("measurement", measurement);
    if (machine) params.set("machine", machine);
    if (sensor) params.set("sensor", sensor);
    const query = params.toString();
    const streamUrl = `${apiUrl("/api/influx/stream")}${
      query ? `?${query}` : ""
    }`;

    let source: EventSource | null = null;

    try {
      source = new EventSource(streamUrl);
    } catch (err) {
      console.error("Failed to open sensor stream", err);
      setConnected(false);
      setError("Tidak dapat membuka koneksi stream InfluxDB.");
      return () => {
        /* no-op */
      };
    }

    const handleOpen = () => {
      if (cancelled) return;
      setConnected(true);
      setError(null);
    };

    const handleError = () => {
      if (cancelled) return;
      setConnected(false);
      setError("Koneksi stream terputus. Mencoba lagi...");
    };

    // keep track of last dispatch times to avoid spamming the UI with events
    const lastDispatch = new Map<string, number>();
    const DISPATCH_COOLDOWN_MS = 10_000; // 10s cooldown per machine

    const handleReading = (event: MessageEvent) => {
      if (cancelled) return;
      try {
        const payload = JSON.parse(event.data) as SensorEventPayload;
        const machineName = String(payload.machineName ?? "").trim() || "-";
        const sensorName = String(payload.sensorName ?? "").trim() || "Sensor";
        const rawValue = payload.value;
        const value =
          typeof rawValue === "number"
            ? rawValue
            : Number.parseFloat(String(rawValue ?? ""));
        if (!Number.isFinite(value)) {
          return;
        }
        const timestamp =
          typeof payload.time === "string" && payload.time.length > 0
            ? payload.time
            : new Date().toISOString();
        const id = `${machineName}::${sensorName}`;
        const entry: LiveSensorReading = {
          id,
          machineName,
          sensorName,
          value,
          time: timestamp,
        };
        setReadings((current) => {
          const filtered = current.filter((item) => item.id !== id);
          const next = [entry, ...filtered];
          if (next.length > limit) {
            next.length = limit;
          }
          return next;
        });

        // If we receive a reading from the weighing/weightning machine, fire
        // the global simulation-disabled event so other UI (e.g. product modal)
        // can react. Use a cooldown to avoid repeated dispatches. Use a
        // substring match to be resilient to small naming/casing differences
        // (e.g. Weightning-01 / weightning-01 / weighing-01).
        try {
          const key = machineName.toLowerCase();
          // debug log to help verify incoming machine names in the browser
          // console.debug is intentionally lightweight and can be removed later
          // once verified.
          try {
            // guard in case console is not available in some environments
            console.debug?.("useSensorStream: incoming machine", machineName);
          } catch (err) {
            /* ignore */
          }

          if (key.includes("weightn") || key.includes("weigh")) {
            const now = Date.now();
            const last = lastDispatch.get("weight") ?? 0;
            if (now - last > DISPATCH_COOLDOWN_MS) {
              try {
                console.debug?.(
                  "useSensorStream: dispatching __simulationDisabled for",
                  machineName
                );
                window.dispatchEvent(
                  new CustomEvent("__simulationDisabled", {
                    detail: { time: new Date().toISOString() },
                  })
                );
              } catch (err) {
                // ignore if window or CustomEvent isn't available
              }
              lastDispatch.set("weight", now);
            }
          }
        } catch (err) {
          // defensive: don't let UI break if dispatch logic fails
          console.warn("Failed to dispatch simulation disabled event", err);
        }
      } catch (err) {
        console.error("Failed to parse sensor event", err);
      }
    };

    source.onopen = handleOpen;
    source.onerror = handleError;
    const readingListener: EventListener = (event) => {
      handleReading(event as MessageEvent);
    };
    source.addEventListener("reading", readingListener);

    return () => {
      cancelled = true;
      if (source) {
        source.removeEventListener("reading", readingListener);
        source.close();
      }
    };
  }, [enabled, machine, measurement, sensor, limit]);

  const orderedReadings = useMemo(() => {
    return [...readings].sort((a, b) => b.time.localeCompare(a.time));
  }, [readings]);

  return {
    readings: orderedReadings,
    connected,
    error,
  };
}
