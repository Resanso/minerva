# Page Topology — GeoGemma `/` (reference) → Minerva `/` (adapted)

Source: rendered DOM dump + desktop/mobile screenshots captured 2026-09-26 via headless Edge
(`--virtual-time-budget=15000`). App is a Vite React SPA: MapLibre GL map, Firebase auth gate,
Cloud Run backend (mocked in clone).

## Visual order (top to bottom, z ascending)

1. **TopHeader** (fixed, h-56px, full width right of left rail)
   - Left: logo mark + "GeoGemma" wordmark.
   - Right: "Dataset Explorer" button (grid icon; reference links out — clone: opens Layers panel).
2. **LeftRail** (fixed left, 60px collapsed / 260px expanded, full height)
   - Top: expand chevron; icons: Chat (active), Earth Agent, New chat.
   - Bottom: Time Series Analysis, Comparison Analysis, Add Custom GeoJSON, Export Data (all "Coming Soon" in reference → clone: disabled with tooltip).
   - Expanded: "New chat" CTA + chat history list (rename/delete per item) + section labels.
3. **MapView** (absolute fill of remaining viewport; base layer CARTO dark, satellite Esri World Imagery)
   - MapLibre chrome: zoom in/out, compass (top-left), fullscreen + geolocate (top-right), scale (bottom-left), attribution OSM/CARTO (bottom-right).
   - Drawing-tools FAB (pencil-ruler, "Open drawing tools") floating right side.
   - Basemap toggle ("Change basemap") floating right side.
4. **RightRail** (fixed right, collapsed icon strip; expanded 380px panel)
   - Icons: Layers (active), Inspect, Information, Fullscreen.
   - Layers panel: "Manage Your Layers", query input ("Enter a query to add a layer"), layer rows (visibility toggle, sort, remove), "Clear All Layers".
   - Inspect panel: "Click on the map to inspect pixel values" / "Click on the map to place a point".
   - Info panel: about/powered-by content.
5. **PromptBar** (floating bottom-center over map)
   - Search icon, input "Search for Earth imagery...", mic ("Voice search"), send ("Search").
6. **ChatPanel** (overlay; thread + welcome state)
   - Welcome: "Welcome to GeoGemma", "Hello! I'm GeoGemma. How can I help you explore Earth observation data today?", "Try asking:" + 3 clickable suggestions, "Powered by Data Commons" link.
   - Thread: user bubbles (right, "U" avatar) + assistant bubbles (icon + markdown), slide/fade-in animation.
7. **SignInModal** (blocking overlay on first paint)
   - "Sign In Required" / "Please sign in to use GeoGemma's features." / "Sign in with Google" / X close.

## Interaction models

- Header/sidebars: static chrome + expand/collapse (click-driven, 0.2–0.3s ease transitions).
- Map: continuous (pan/zoom), geolocate + fullscreen browser APIs.
- Prompt/chat: click/submit-driven; mock assistant reply after short delay with typing indicator.
- Layers: click-driven list management; layer visibility toggles MapLibre layer `visibility` layout property.
- Modal: dismissible; mock sign-in sets local user state (no backend).

## Responsive (390px observed)

Same fixed chrome; rails stay collapsed; expanded panels become full-width overlays; prompt bar full-width with margins. No layout breakpoint in reference CSS — clone keeps this, verifies at 1440/768/390.

## TOKEN_MAP (reference → Minerva adaptation)

| Usage | Reference | Minerva adapted |
|---|---|---|
| App bg | #181818 | #0c1220 (`bg-[#0c1220]`) |
| Surface/panel | #181818/#303134 panels | #10192e cards, slate-900/60 overlays |
| Border | #333/#3c4043, white/10 | white/10 |
| Primary text | #e8eaed | slate-100 |
| Secondary text | #9aa0a6/#8e8ea0 | slate-400/slate-500 |
| Accent/interactive | #8ab4f8 | blue-500/blue-600 (glow per TopBar precedent) |
| User bubble | #3166c7 | blue-600 |
| Assistant bubble | #303134 | #10192e / slate-900 |
| Success | #81c995 | emerald-400 |
| Error | #f28b82 | red-400/red-500 |
| Font | Roboto + Product Sans | Geist (`--font-geist-sans`, already in app) |
| Radius | 6–8px panels, 20px chat input, full FAB | rounded-lg/xl panels, rounded-full prompt (matches Minerva pill language) |
