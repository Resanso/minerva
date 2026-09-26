"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BasemapIcon, PencilRulerIcon } from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";
import type { MockLayer } from "./types";
import { cn } from "@/lib/utils";

const DARK_TILES = ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"];
const SAT_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];

function baseStyle(satellite: boolean): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      base: {
        type: "raster",
        tiles: satellite ? SAT_TILES : DARK_TILES,
        tileSize: 256,
        attribution: satellite
          ? "Esri, Maxar, Earthstar Geographics"
          : "© OpenStreetMap contributors © CARTO",
      },
    },
    layers: [{ id: "base", type: "raster", source: "base" }],
  };
}

function fract(x: number) {
  return x - Math.floor(x);
}

function mockPixelValues(lng: number, lat: number) {
  const seed = (band: number) => fract(Math.sin(lng * 12.9898 + lat * 78.233 + band * 37.719) * 43758.5453);
  return [
    { band: "B04 (Red)", value: (0.05 + seed(1) * 0.35).toFixed(3) },
    { band: "B08 (NIR)", value: (0.1 + seed(2) * 0.5).toFixed(3) },
    { band: "NDVI", value: (seed(3) * 2 - 1).toFixed(3) },
  ];
}

function applyMockLayers(map: maplibregl.Map, layers: MockLayer[]) {
  if (!map.isStyleLoaded()) return;
  // Clear previous mock layers/sources.
  for (const l of layers) {
    if (map.getLayer(l.id)) map.removeLayer(l.id);
    if (map.getSource(l.id)) map.removeSource(l.id);
  }
  // Also sweep orphaned mock ids (e.g. after clear-all).
  const style = map.getStyle();
  for (const layer of [...(style?.layers ?? [])]) {
    if (layer.id.startsWith("mock-") && !layers.some((l) => l.id === layer.id)) {
      try {
        map.removeLayer(layer.id);
      } catch {
        /* ignore */
      }
    }
  }
  for (const l of layers) {
    if (map.getSource(l.id)) continue;
    map.addSource(l.id, { type: "geojson", data: l.geojson });
    if (l.kind === "fill") {
      map.addLayer({
        id: l.id,
        type: "fill",
        source: l.id,
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "ndvi"], 0.5],
            0.2,
            "#f44336",
            0.5,
            "#fdd663",
            0.8,
            "#4caf50",
          ],
          "fill-opacity": 0.55,
        },
        layout: { visibility: l.visible ? "visible" : "none" },
      });
    } else {
      map.addLayer({
        id: l.id,
        type: "circle",
        source: l.id,
        paint: {
          "circle-radius": 9,
          "circle-color": l.color,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.9,
        },
        layout: { visibility: l.visible ? "visible" : "none" },
      });
    }
  }
}

export default function MapView() {
  const {
    basemap,
    setBasemap,
    layers,
    layerRevision,
    pins,
    mapTool,
    setMapTool,
    addPin,
    setInspectResult,
    toggleRight,
    rightPanel,
    registerMap,
    pushNotice,
    leftExpanded,
  } = useGeoGemma();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapHolder = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const toolRef = useRef(mapTool);
  toolRef.current = mapTool;

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapHolder.current) return;
    // Turbopack/Next cannot resolve MapLibre's worker through the bundler, so
    // serve the prebuilt worker from `public/` (see public/maplibre/README).
    try {
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    } catch {
      /* ignore */
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle(false),
      center: [20, 20],
      zoom: 1.5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-left");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      "top-right"
    );
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), "bottom-left");
    mapHolder.current = map;
    registerMap(map);

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const tool = toolRef.current;
      if (tool === "place-point") {
        const label = `${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`;
        addPin(e.lngLat.lng, e.lngLat.lat, label);
        setInspectResult({ kind: "point", lng: e.lngLat.lng, lat: e.lngLat.lat });
        setMapTool("pan");
        pushNotice(`Point placed at ${label}`);
      } else if (tool === "inspect-pixel") {
        setInspectResult({
          kind: "pixel",
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          values: mockPixelValues(e.lngLat.lng, e.lngLat.lat),
        });
        setMapTool("pan");
      }
    };
    map.on("click", onClick);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setMapTool("pan");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      map.off("click", onClick);
      map.remove();
      mapHolder.current = null;
      registerMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap switch.
  useEffect(() => {
    const map = mapHolder.current;
    if (!map) return;
    map.setStyle(baseStyle(basemap === "satellite"));
  }, [basemap]);

  // Re-apply mock layers after style loads + on layer changes.
  useEffect(() => {
    const map = mapHolder.current;
    if (!map) return;
    applyMockLayers(map, layers);
    const onIdle = () => applyMockLayers(map, layers);
    map.on("idle", onIdle);
    return () => {
      map.off("idle", onIdle);
    };
  }, [layers, layerRevision]);

  // Markers for pins.
  useEffect(() => {
    const map = mapHolder.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = pins.map((p) => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 10px rgba(59,130,246,.8);cursor:pointer;";
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(p.label))
        .addTo(map);
      return marker;
    });
  }, [pins]);

  // Cursor + resize on chrome changes.
  useEffect(() => {
    const map = mapHolder.current;
    if (!map) return;
    try {
      map.getCanvas().style.cursor = mapTool === "pan" ? "" : "crosshair";
      map.resize();
    } catch {
      /* ignore */
    }
  }, [mapTool, leftExpanded, rightPanel]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" aria-label="Map" />

      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        <button
          type="button"
          title="Change basemap"
          aria-label="Change basemap"
          onClick={() => {
            setBasemap(basemap === "dark" ? "satellite" : "dark");
            pushNotice(basemap === "dark" ? "Satellite basemap on" : "Dark basemap on");
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#10192e] text-blue-400 shadow-xl transition-all hover:scale-105 hover:bg-[#16213a]"
        >
          <BasemapIcon width={20} height={20} />
        </button>
        <button
          type="button"
          title="Open drawing tools"
          aria-label="Open drawing tools"
          onClick={() => {
            setMapTool(mapTool === "place-point" ? "pan" : "place-point");
            if (mapTool !== "place-point") pushNotice("Click on the map to place a point (Esc to cancel)");
          }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-all hover:scale-105",
            mapTool === "place-point"
              ? "border-blue-500 bg-blue-600 text-white"
              : "border-white/10 bg-[#10192e] text-blue-400 hover:bg-[#16213a]"
          )}
        >
          <PencilRulerIcon width={20} height={20} />
        </button>
      </div>

      {mapTool !== "pan" && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-blue-500/40 bg-[#10192e]/95 px-4 py-1.5 text-xs font-medium text-blue-300 shadow-xl">
          {mapTool === "place-point"
            ? "Click on the map to place a point — Esc to cancel"
            : "Click on the map to inspect pixel values — Esc to cancel"}
        </div>
      )}
    </div>
  );
}
