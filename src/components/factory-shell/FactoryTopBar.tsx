"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveSensorTicker from "@/components/LiveSensorTicker";
import ProductDataViewerModal from "@/components/ProductDataViewerModal";
import { formatTimestamp, useNotifications } from "./useNotifications";

const severityDot: Record<string, string> = {
  critical: "bg-[#f28b82]",
  warning: "bg-[#fdd663]",
  info: "bg-[#8ab4f8]",
};

export function openAskAi(question?: string) {
  try {
    window.dispatchEvent(new CustomEvent("__openAskAi", { detail: { question } }));
  } catch {
    /* ignore */
  }
}

export function openModelModal(machineId: string) {
  try {
    window.dispatchEvent(new CustomEvent("__openModelModal", { detail: { id: machineId } }));
  } catch {
    /* ignore */
  }
}

export default function FactoryTopBar({ leftOffset }: { leftOffset: number }) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [bellOpen, setBellOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (bellRef.current?.contains(event.target as Node)) return;
      setBellOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 right-0 z-40 flex h-14 items-center gap-4 border-b border-[#333333] bg-[#181818] px-4 transition-all duration-300"
        style={{ left: leftOffset }}
      >
        <div className="flex shrink-0 items-center gap-2.5">
          <img src="/minerva-logo.png" alt="Minerva" className="h-7 w-auto" />
          <span className="hidden rounded-md bg-[rgba(232,234,237,0.08)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#9aa0a6] xl:inline-block">
            Nama Pabrik
          </span>
          <span className="rounded-md bg-[rgba(138,180,248,0.15)] px-2.5 py-1 text-xs font-medium text-[#8ab4f8]">
            Smelter
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <LiveSensorTicker />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 rounded-md bg-[#2d2d2d] font-medium text-[#e8eaed] hover:bg-[#3d3d3d] hover:text-white"
            onClick={() => openAskAi()}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Ask AI</span>
          </Button>
          <Button
            size="sm"
            className="hidden gap-1.5 rounded-md bg-[#2d2d2d] font-medium text-[#e8eaed] hover:bg-[#3d3d3d] hover:text-white sm:inline-flex"
            onClick={() => setProductOpen(true)}
          >
            <Database className="h-3.5 w-3.5" />
            Data Produk
          </Button>
          <div ref={bellRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="text-[#acacbe] hover:bg-[rgba(232,234,237,0.08)] hover:text-[#e8eaed]"
              onClick={() => {
                setBellOpen((prev) => {
                  if (!prev) markAllRead();
                  return !prev;
                });
              }}
            >
              <span className="relative inline-flex">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#f28b82]" />
                )}
              </span>
            </Button>
            {bellOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-lg border border-[#3c4043] bg-[#202124] p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#e8eaed]">Notifications</span>
                  <span className="text-xs text-[#9aa0a6]">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {notifications.length ? (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.machineId) openModelModal(item.machineId);
                          markRead(item.id);
                          setBellOpen(false);
                        }}
                        className="flex w-full flex-col gap-1 rounded-md border border-transparent px-3 py-2 text-left transition hover:border-[rgba(138,180,248,0.4)] hover:bg-[#2a2a2a]"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-medium text-[#e8eaed]">
                            <span className={`h-2.5 w-2.5 rounded-full ${severityDot[item.severity]}`} />
                            <span>{item.title}</span>
                          </div>
                          <span className="text-right text-[11px] text-[#9aa0a6]">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[#bdc1c6]">{item.message}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed border-[#3c4043] px-3 py-6 text-center text-sm text-[#9aa0a6]">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <ProductDataViewerModal isOpen={productOpen} onCloseAction={() => setProductOpen(false)} />
    </>
  );
}
