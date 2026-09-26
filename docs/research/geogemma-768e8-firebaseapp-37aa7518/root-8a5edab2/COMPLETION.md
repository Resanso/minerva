# Completion — GeoGemma clone (Minerva-adapted) → `/`

- **Source → destination:** https://geogemma-768e8.firebaseapp.com/ (`/`) → app route `/`
- **Existing routes preserved:** `/compro` untouched (code + build output identical); previous `/` (3D `GLTFViewer` homepage) relocated to `/twin` with AppShell chrome intact.
- **Sections built:** 7 — TopHeader, LeftSidebar (+history/rename/delete), MapView (MapLibre + basemap toggle + drawing/inspect tools), RightSidebar (Layers/Inspect/Info panels), PromptBar (+voice graceful), ChatPanel (welcome/suggestions/thread/markdown), SignInModal (mock auth, once via localStorage).
- **Components created:** 13 files under `src/components/sites/geogemma-768e8-firebaseapp-37aa7518/` (store, types, mock-data, icons, 7 components, page assembly).
- **Spec files written:** 7 (one per section, each with Minerva-adaptation notes) + OUTPUT_PLAN + PAGE_TOPOLOGY (+TOKEN_MAP) + BEHAVIORS.
- **Assets downloaded:** 0 binaries (logo redrawn as SVG; map tiles live via CARTO/Esri with attribution; geocoding live via Nominatim). MapLibre worker vendored to `public/maplibre/` (Turbopack cannot bundle the worker; `setWorkerUrl` fix, console-error verified gone).
- **Build status:** `npm run check` green — `tsc --noEmit` clean, `next build` success (`/`, `/twin`, `/compro`).
- **Visual QA:** headless-Edge screenshots vs reference — modal + chrome + prompt bar match (see `ours-desktop2.png` in temp + `desktop-1440.png` reference). DOM audit: canvas, controls, scale, all panels present. Map tiles black in sandbox screenshots = sandbox DNS only (CARTO/Esri/Nominatim all verified 200 via direct fetch); loads on normal networks.
- **Known gaps / mock deviations:** no Firebase/OAuth/Cloud Run (mock user + canned replies); Dataset Explorer button opens Layers panel; voice uses WebSpeech when available else disabled notice; drag-reorder replaced by up/down buttons; no streaming (900ms canned append); pixel-inspect values are deterministic mock; chat history seeds 2 sessions.
