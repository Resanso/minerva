import type { ChatSession, MockLayer } from "./types";

export const GREETING =
  "Hello! I'm GeoGemma. How can I help you explore Earth observation data today?";

export const SUGGESTIONS: string[] = [
  "What is the population of France?",
  "Show me GDP data for Asian countries",
  "Compare CO2 emissions between US and China",
];

function grid(centerLng: number, centerLat: number, step: number, n: number) {
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = centerLng + (i - (n - 1) / 2) * step;
      const y = centerLat + (j - (n - 1) / 2) * step;
      const h = step / 2;
      features.push({
        type: "Feature",
        properties: { ndvi: Math.round((0.25 + ((i * 7 + j * 13) % 60) / 100) * 100) / 100 },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x - h, y - h],
              [x + h, y - h],
              [x + h, y + h],
              [x - h, y + h],
              [x - h, y - h],
            ],
          ],
        },
      });
    }
  }
  return features;
}

export function ndviParisLayer(): MockLayer {
  return {
    id: "ndvi-paris-2023",
    name: "NDVI vegetation — Paris 2023",
    meta: "Sentinel-2 · 10 m · mock sample",
    color: "#4caf50",
    visible: true,
    kind: "fill",
    geojson: {
      type: "FeatureCollection",
      features: grid(2.35, 48.86, 0.04, 7),
    },
  };
}

export function gdpAsiaLayer(): MockLayer {
  const pts: [number, number, string, string][] = [
    [116.4, 39.9, "China", "$17.8T"],
    [77.2, 28.6, "India", "$3.6T"],
    [139.7, 35.7, "Japan", "$4.2T"],
    [106.8, -6.2, "Indonesia", "$1.4T"],
  ];
  return {
    id: "gdp-asia",
    name: "GDP — Asian countries",
    meta: "Data Commons · mock sample",
    color: "#60a5fa",
    visible: true,
    kind: "circle",
    geojson: {
      type: "FeatureCollection",
      features: pts.map(([lng, lat, name, gdp]) => ({
        type: "Feature" as const,
        properties: { name, gdp },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      })),
    },
  };
}

export function co2CompareLayer(): MockLayer {
  const pts: [number, number, string, string][] = [
    [-98.5, 39.8, "United States", "5.0 Gt CO₂ / yr"],
    [104.2, 35.9, "China", "11.4 Gt CO₂ / yr"],
  ];
  return {
    id: "co2-us-cn",
    name: "CO₂ — US vs China",
    meta: "EDGAR · mock sample",
    color: "#fb923c",
    visible: true,
    kind: "circle",
    geojson: {
      type: "FeatureCollection",
      features: pts.map(([lng, lat, name, co2]) => ({
        type: "Feature" as const,
        properties: { name, co2 },
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      })),
    },
  };
}

export interface CannedReply {
  match: RegExp;
  reply: string;
  layer?: () => MockLayer;
  flyTo?: { lng: number; lat: number; zoom: number };
}

export const CANNED_REPLIES: CannedReply[] = [
  {
    match: /population.*france|france.*population/i,
    reply: `**France — population (mock Data Commons sample)**\n\n- **Total:** ~68.2 million (2023)\n- **Paris metro:** ~11.1 million\n- **Density:** ~119 people / km²\n\nAsk me to *show NDVI vegetation in Paris for 2023* to overlay a sample layer.`,
  },
  {
    match: /gdp.*asia|asia.*gdp/i,
    reply: `**GDP — selected Asian countries (mock sample, USD nominal)**\n\n- **China:** $17.8T\n- **Japan:** $4.2T\n- **India:** $3.6T\n- **Indonesia:** $1.4T\n\nI've added the sample layer to your map — manage it under **Layers**.`,
    layer: gdpAsiaLayer,
    flyTo: { lng: 100, lat: 28, zoom: 2.5 },
  },
  {
    match: /co2|emissions.*(us|china|u\.s)|compare.*co/i,
    reply: `**CO₂ emissions — US vs China (mock EDGAR-style sample)**\n\n- **China:** ~11.4 Gt / yr\n- **United States:** ~5.0 Gt / yr\n\nMarkers are on the map. Toggle them anytime in **Layers**.`,
    layer: co2CompareLayer,
    flyTo: { lng: -150, lat: 45, zoom: 1.8 },
  },
  {
    match: /ndvi|vegetation.*paris|paris.*vegetation/i,
    reply: `**NDVI vegetation — Paris 2023 (mock Sentinel-2 style sample)**\n\n- Mean NDVI over the grid: **~0.52** (healthy urban green)\n- Highest values cluster around **Bois de Boulogne** (west) and **Bois de Vincennes** (east)\n\nThe sample grid is now a map layer — use the eye icon in **Layers** to compare.`,
    layer: ndviParisLayer,
    flyTo: { lng: 2.35, lat: 48.86, zoom: 10 },
  },
];

export const FALLBACK_REPLY = `Here's a **mock analysis** of your query (demo build — no backend connected):\n\n- I located **2 candidate scenes** and **1 reference layer**\n- Try one of the suggestions, or ask for **NDVI Paris**, **GDP Asia**, or a **CO₂ comparison**\n- Or type a place name and I'll fly the map there`;

export const SEED_SESSIONS: ChatSession[] = [
  {
    id: "seed-ndvi",
    title: "NDVI vegetation in Paris",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      { id: "m1", role: "user", content: "Show NDVI vegetation in Paris for 2023" },
      {
        id: "m2",
        role: "assistant",
        content:
          "**NDVI vegetation — Paris 2023 (mock sample)**\n\n- Mean NDVI: **~0.52**\n- Greenest: Bois de Boulogne, Bois de Vincennes",
      },
    ],
  },
  {
    id: "seed-gdp",
    title: "GDP data for Asian countries",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    messages: [
      { id: "m1", role: "user", content: "Show me GDP data for Asian countries" },
      {
        id: "m2",
        role: "assistant",
        content:
          "**GDP — mock sample:** China $17.8T · Japan $4.2T · India $3.6T · Indonesia $1.4T",
      },
    ],
  },
];

export function replyFor(query: string): CannedReply | null {
  return CANNED_REPLIES.find((c) => c.match.test(query)) ?? null;
}
