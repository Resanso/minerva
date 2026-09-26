# Factory Shell — Minerva content, GeoGemma chrome

## Layout (mirrors reference topology)

- **FactoryTopBar** (fixed h-14, left offset follows rail): Minerva logo +
  `Nama Pabrik` / `Smelter` badges (legacy TopBar identity), `LiveSensorTicker`
  centered (existing component, untouched), right actions: Ask AI (dispatches
  `__openAskAi`), Data Produk (existing `ProductDataViewerModal`), bell with
  notification dropdown (same JSON source + ordering as legacy TopBar).
- **FactoryLeftRail** (60px / 260px): 3D View, Simulation (calls
  `openConfigurator()` from `useSimulation`, active in simulation mode),
  Product Data (existing modal), Ask AI (event). Expanded shows labels +
  live status (mode/variant/elapsed). Bottom: links to `/compro`, `/geogemma`.
- **FactoryRightRail** (strip + 380px panels): Machines (from `loadMachines()`,
  health + alarms per row, click dispatches legacy `__openModelModal` which
  GLTFViewer already handles), Notifications, Information, Fullscreen.
- **FactoryPromptBar** (floating bottom-center pill): input + mic (graceful
  degrade) + send → opens Ask AI dialog with prefilled question. Mounts
  `<AskAiButton hideTrigger/>` (dialog logic untouched).
- **BottomBar** (existing transport, untouched logic): docks at `bottom-24`
  on `/` so it sits above the prompt pill; `bottom-4` everywhere else
  (pathname conditional).

## Theme pass — Google-dark (2026-09-26, user: "Google-ish kaya gambar 1")

Shell chrome converted 1:1 to reference tokens (structure untouched):

- Font: Roboto (300/400/500/700) via `next/font/google`, applied at route
  (`src/app/page.tsx` wrapper — font loaders must run server-side).
- Surfaces: app/rails/panels `#181818`, borders `#333333`, inputs + prompt
  pill `#303134` with `#3c4043` borders, cards `#202124`, row hover `#2a2a2a`.
- Text: `#e8eaed` / `#bdc1c6` / `#9aa0a6`, rail icons `#acacbe`, section
  labels `#8e8ea0`.
- Accent: `#8ab4f8` (active rail/panel tabs with 2px underline like the
  reference Layers/Inspect/Info tabs, focus rings, Smelter chip on
  `rgba(138,180,248,.15)`); mic `#8ab4f8`.
- Send button: light-blue circle `bg-[#a8c8ff]` + `#202124` icon, scale-105
  hover (disabled = dimmed, as in reference).
- Header actions + ticker: Google gray `#3c4043` pills; severity dots
  `#f28b82` / `#fdd663` / `#8ab4f8`; health `#81c995` / `#fdd663` / `#f28b82`.
- Right panel header converted from title+close to Google tab bar
  (Machines / Notifications / Info) + close X.
- Deliberately untouched: `BottomBar` transport, `GLTFViewer`, all modals
  (existing Minerva components; restyle on request).

## Additive-only edits to existing code

- `AskAiButton`: `hideTrigger` prop + `__openAskAi` event listener.
- `AppShell`: chrome hidden on `/` and `/geogemma` (was `/` only).
- `BottomBar`: pathname-based bottom offset (styling only).
- `LiveSensorTicker`: container + stream colors moved to Google grays/green
  (neutral dark, safe on both old and new chrome).

## QA (2026-09-26, Playwright + headless Edge @1440)

- `/` renders: header, rails, 3D twin, transport pill, prompt pill — zero
  console errors (one hydration mismatch from a `window` check in the prompt
  bar found and fixed via post-hydration `useEffect`).
- `/geogemma` 200, `/twin` error-free, `/compro` untouched.
- `npm run check` green (typecheck + production build, all 4 routes).
