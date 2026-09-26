# Behaviors — GeoGemma `/` (observed via DOM/CSS/JS bundle static analysis)

Extraction method: headless-Edge rendered DOM + `index-*.js` string inventory + `index-*.css`
rule inventory. No live click-session possible (auth gate, no browser MCP in this environment);
behaviors below are taken from shipped code, not guesswork.

## Scroll sweep — n/a (immersive app, no page scroll)

`body` is fixed-viewport; `.layout-content` is 100vh overflow hidden. Clone lives in the same
constraint (app `body { overflow: hidden }`). Internal scroll regions: chat history list,
chat thread, layers list (thin custom scrollbars).

## Click sweep (from code)

- Sidebar expand chevron toggles 60px ↔ 260px (`transition: width .3s ease`; content margin-left follows).
- Left icons switch left-panel mode: Chat (history), Earth Agent (agent thread), New chat (fresh thread).
- "Coming Soon" rail buttons (Time Series, Comparison, GeoJSON, Export): no-op + tooltip in clone.
- Right icons switch right panel: Layers / Inspect / Information; Fullscreen toggles browser fullscreen.
- Basemap toggle switches CARTO dark ↔ Esri World Imagery (+ label update).
- Drawing-tools button arms "place point" mode: next map click drops a marker + coordinate readout; Esc/second click disarms.
- Prompt submit: appends user message, shows typing indicator, mock assistant reply (canned, topic-matched by keyword: population/GDP/CO2/NDVI + generic fallback), auto-scrolls thread.
- Suggestion chips submit their query verbatim.
- Layer rows: eye toggles visibility, trash removes, drag/grip reorders (clone: up/down buttons — simpler, same outcome), "Clear All Layers" empties with toast-equivalent inline notice.
- "Dataset Explorer" header button: reference opens external explorer; clone opens Layers panel (keeps user in-app; documented deviation).
- Modal: X or backdrop click dismisses; "Sign in with Google" performs mock sign-in (avatar "U" → "G", name "Guest Researcher") and dismisses. Persists to localStorage so it shows once.
- Voice button: reference uses Web Speech; clone attempts `webkitSpeechRecognition` when present, else disabled with tooltip (graceful, no fake).

## Hover sweep

- `.sidebar-icon` / rail buttons: bg lift + accent tint, 0.2s ease.
- `.chat-item:hover`: `#2a2a2a` bg (adapted: white/5).
- Submit buttons: scale(1.05) + accent glow.
- Map controls: default MapLibre hover states (kept).

## Map specifics (MapLibre, real tiles — no key required)

- Sources: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` (adapted: keep dark_all — matches Minerva dark; satellite: Esri World Imagery tiles).
- Controls: NavigationControl (visualize pitch disabled to keep flat), FullscreenControl, GeolocateControl, ScaleControl, AttributionControl (compact).
- Geocoding: Nominatim `search?format=json&q=` on prompt submit when query looks geographic; errors → inline notice, never crash.
- Mock data layers (local GeoJSON, no backend): NDVI Paris grid sample, GDP choropleth sample (few countries), CO2 comparison markers. Added via "query" keywords or suggestion chips; listed in Layers panel with show/hide/remove/reorder.

## Auth/backend deviations (documented, approved scope = UI + mock)

- No Firebase, no Cloud Run calls. All data canned in `mock-data.ts`.
- No real "Sign in with Google" OAuth. No voice-to-text guarantee. No dataset explorer external link.
