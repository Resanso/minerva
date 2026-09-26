"use client";

import { useEffect, useState } from "react";
import { Bell, Cpu, Info, Maximize, X } from "lucide-react";
import { loadMachines } from "@/lib/machines";
import type { MachineDetails } from "@/lib/machines";
import { formatTimestamp, useNotifications } from "./useNotifications";
import { openModelModal } from "./FactoryTopBar";
import { cn } from "@/lib/utils";

type Panel = "machines" | "notifications" | "info" | null;

const TABS: { key: Exclude<Panel, null>; label: string }[] = [
  { key: "machines", label: "Machines" },
  { key: "notifications", label: "Notifications" },
  { key: "info", label: "Info" },
];

function StripButton({
  title,
  active,
  badge,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  badge?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200",
        active
          ? "bg-[rgba(138,180,248,0.12)] text-[#8ab4f8]"
          : "text-[#acacbe] hover:bg-[rgba(232,234,237,0.08)] hover:text-[#e8eaed]"
      )}
    >
      {children}
      {badge && (
        <span className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-[#f28b82]" />
      )}
    </button>
  );
}

function healthColor(score: number) {
  if (score >= 80) return "text-[#81c995]";
  if (score >= 60) return "text-[#fdd663]";
  return "text-[#f28b82]";
}

export default function FactoryRightRail() {
  const [panel, setPanel] = useState<Panel>(null);
  const [machines, setMachines] = useState<MachineDetails[] | null>(null);
  const { notifications, unreadCount, markRead } = useNotifications();

  useEffect(() => {
    if (panel !== "machines" || machines) return;
    let alive = true;
    loadMachines()
      .then((list) => {
        if (alive) setMachines(list);
      })
      .catch(() => {
        if (alive) setMachines([]);
      });
    return () => {
      alive = false;
    };
  }, [panel, machines]);

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="fixed bottom-0 right-0 top-14 z-40 flex w-[60px] flex-col items-center gap-1.5 border-l border-[#333333] bg-[#181818] py-3">
        <StripButton
          title="Machines"
          active={panel === "machines"}
          onClick={() => setPanel((p) => (p === "machines" ? null : "machines"))}
        >
          <Cpu className="h-5 w-5" />
        </StripButton>
        <StripButton
          title="Notifications"
          active={panel === "notifications"}
          badge={unreadCount > 0}
          onClick={() => setPanel((p) => (p === "notifications" ? null : "notifications"))}
        >
          <Bell className="h-5 w-5" />
        </StripButton>
        <StripButton
          title="Information"
          active={panel === "info"}
          onClick={() => setPanel((p) => (p === "info" ? null : "info"))}
        >
          <Info className="h-5 w-5" />
        </StripButton>
        <StripButton title="Fullscreen" onClick={toggleFullscreen}>
          <Maximize className="h-5 w-5" />
        </StripButton>
      </div>

      {panel && (
        <section className="fixed bottom-0 right-[60px] top-14 z-30 flex w-[380px] max-w-[calc(100vw-60px)] flex-col border-l border-[#333333] bg-[#181818] shadow-2xl">
          <div className="flex items-stretch gap-1 border-b border-[#333333] px-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPanel(t.key)}
                className={cn(
                  "flex-1 border-b-2 px-2 py-3 text-sm transition-colors",
                  panel === t.key
                    ? "border-[#8ab4f8] font-medium text-[#8ab4f8]"
                    : "border-transparent text-[#9aa0a6] hover:text-[#e8eaed]"
                )}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close panel"
              className="self-center rounded p-1.5 text-[#9aa0a6] hover:bg-[rgba(232,234,237,0.08)] hover:text-[#e8eaed]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {panel === "machines" && (
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
              {machines === null ? (
                <p className="py-8 text-center text-sm text-[#9aa0a6]">Loading machines…</p>
              ) : machines.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#9aa0a6]">No machines found</p>
              ) : (
                machines.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openModelModal(m.machineId || m.id)}
                    title={`Open ${m.title}`}
                    className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-[rgba(138,180,248,0.4)] hover:bg-[#2a2a2a]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#e8eaed]">
                        {m.title}
                      </span>
                      <span className="block truncate text-xs text-[#9aa0a6]">
                        {m.location} · {m.alarms.active}/{m.alarms.total} alarms
                      </span>
                    </span>
                    <span className={cn("font-mono text-sm font-medium", healthColor(m.healthScore))}>
                      {m.healthScore}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {panel === "notifications" && (
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#9aa0a6]">No notifications</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.machineId) openModelModal(item.machineId);
                      markRead(item.id);
                    }}
                    className="flex w-full flex-col gap-1 rounded-md border border-transparent px-3 py-2 text-left transition hover:border-[rgba(138,180,248,0.4)] hover:bg-[#2a2a2a]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#e8eaed]">{item.title}</span>
                      <span className="text-[11px] text-[#9aa0a6]">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-[#bdc1c6]">{item.message}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {panel === "info" && (
            <div className="space-y-3 overflow-y-auto p-4 text-sm leading-relaxed text-[#bdc1c6]">
              <p>
                <strong className="font-medium text-[#e8eaed]">MINERVA Smelter Plant</strong> —
                real-time digital-twin monitoring with AI energy optimization, predictive
                maintenance, and smart simulation.
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-[#8e8ea0]">
                How to use
              </p>
              <ul className="list-disc space-y-1 pl-5 text-[#9aa0a6]">
                <li>Click a machine in 3D to open its detail modal.</li>
                <li>Use the left rail to run simulations or open product data.</li>
                <li>Ask AI about machine performance via the bottom prompt.</li>
              </ul>
              <p className="text-xs text-[#9aa0a6]">
                Bandung, Jawa Barat, Indonesia · minerva@gmail.com
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
