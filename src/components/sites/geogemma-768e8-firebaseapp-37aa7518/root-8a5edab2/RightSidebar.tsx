"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  FullscreenIcon,
  InfoIcon,
  InspectIcon,
  LayersIcon,
  TrashIcon,
  XIcon,
} from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";
import { ndviParisLayer } from "./mock-data";
import { cn } from "@/lib/utils";

function StripButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
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
        "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200",
        active
          ? "bg-blue-600/20 text-blue-400"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

export default function RightSidebar() {
  const {
    rightPanel,
    toggleRight,
    closeRight,
    layers,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    moveLayer,
    clearLayers,
    setMapTool,
    mapTool,
    inspectResult,
    pushNotice,
  } = useGeoGemma();
  const [query, setQuery] = useState("");

  const addFromQuery = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes("ndvi") || q.includes("paris") || q.includes("vegetation")) {
      addLayer(ndviParisLayer());
      pushNotice("Layer added: NDVI vegetation — Paris 2023");
      setQuery("");
    } else {
      pushNotice("No mock layer matched — try 'NDVI Paris'");
    }
  };

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch {
      pushNotice("Fullscreen not available");
    }
  };

  return (
    <>
      <div className="fixed bottom-0 right-0 top-14 z-40 flex w-[60px] flex-col items-center gap-1.5 border-l border-white/10 bg-[#0c1220] py-3">
        <StripButton title="Layers" active={rightPanel === "layers"} onClick={() => toggleRight("layers")}>
          <LayersIcon width={20} height={20} />
        </StripButton>
        <StripButton title="Inspect" active={rightPanel === "inspect"} onClick={() => toggleRight("inspect")}>
          <InspectIcon width={20} height={20} />
        </StripButton>
        <StripButton title="Information" active={rightPanel === "info"} onClick={() => toggleRight("info")}>
          <InfoIcon width={20} height={20} />
        </StripButton>
        <StripButton title="Fullscreen" onClick={toggleFullscreen}>
          <FullscreenIcon width={20} height={20} />
        </StripButton>
      </div>

      {rightPanel && (
        <section className="fixed bottom-0 right-[60px] top-14 z-30 flex w-[380px] max-w-[calc(100vw-60px)] flex-col border-l border-white/10 bg-[#0c1220]/98 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">
              {rightPanel === "layers" && "Manage Your Layers"}
              {rightPanel === "inspect" && "Inspect Map"}
              {rightPanel === "info" && "Information"}
            </h2>
            <button
              type="button"
              onClick={closeRight}
              aria-label="Close panel"
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>

          {rightPanel === "layers" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addFromQuery();
                }}
                className="flex gap-2"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter a query to add a layer"
                  aria-label="Enter a query to add a layer"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Add
                </button>
              </form>

              {layers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">
                  No layers available
                </p>
              ) : (
                <ul className="space-y-2">
                  {layers.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition-colors hover:border-blue-500/40"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: l.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-200">{l.name}</span>
                        <span className="block truncate text-xs text-slate-500">{l.meta}</span>
                      </span>
                      <button
                        type="button"
                        title={l.visible ? "Hide layer" : "Show layer"}
                        aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`}
                        onClick={() => toggleLayerVisibility(l.id)}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      >
                        {l.visible ? <EyeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
                      </button>
                      <button
                        type="button"
                        title="Move up"
                        aria-label={`Move ${l.name} up`}
                        onClick={() => moveLayer(l.id, -1)}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      >
                        <ArrowUpIcon width={15} height={15} />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        aria-label={`Move ${l.name} down`}
                        onClick={() => moveLayer(l.id, 1)}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      >
                        <ArrowDownIcon width={15} height={15} />
                      </button>
                      <button
                        type="button"
                        title="Remove layer"
                        aria-label={`Remove ${l.name}`}
                        onClick={() => {
                          removeLayer(l.id);
                          pushNotice("Layer removed");
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-red-400"
                      >
                        <TrashIcon width={15} height={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {layers.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearLayers()}
                  className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Clear All Layers
                </button>
              )}
            </div>
          )}

          {rightPanel === "inspect" && (
            <div className="flex flex-col gap-2 overflow-y-auto p-4">
              <button
                type="button"
                onClick={() => setMapTool(mapTool === "inspect-pixel" ? "pan" : "inspect-pixel")}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  mapTool === "inspect-pixel"
                    ? "border-blue-500 bg-blue-600/20 text-blue-200"
                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-blue-500/40"
                )}
              >
                Click on the map to inspect pixel values
              </button>
              <button
                type="button"
                onClick={() => setMapTool(mapTool === "place-point" ? "pan" : "place-point")}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  mapTool === "place-point"
                    ? "border-blue-500 bg-blue-600/20 text-blue-200"
                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-blue-500/40"
                )}
              >
                Click on the map to place a point
              </button>
              {inspectResult && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <p className="mb-1 font-mono text-xs text-slate-400">
                    {inspectResult.lat.toFixed(5)}, {inspectResult.lng.toFixed(5)}
                  </p>
                  {inspectResult.values ? (
                    <ul className="space-y-1">
                      {inspectResult.values.map((v) => (
                        <li key={v.band} className="flex justify-between text-slate-200">
                          <span>{v.band}</span>
                          <span className="font-mono">{v.value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-300">Point marker placed on the map.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {rightPanel === "info" && (
            <div className="space-y-3 overflow-y-auto p-4 text-sm leading-relaxed text-slate-300">
              <p>
                <strong className="text-slate-100">GeoGemma</strong> is an open
                vision-language model for Earth observation. This demo-style
                interface lets you search places, manage map layers, and ask
                geospatial questions.
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-500">Data credits</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-400">
                <li>Basemap © OpenStreetMap contributors © CARTO</li>
                <li>Satellite: Esri World Imagery</li>
                <li>Geocoding: Nominatim (OpenStreetMap)</li>
                <li>Statistics: Data Commons</li>
              </ul>
              <p>
                Powered by{" "}
                <a
                  href="https://datacommons.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Data Commons
                </a>
              </p>
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Demo build: chat answers, layers, and sign-in are local mocks — no backend connected.
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
