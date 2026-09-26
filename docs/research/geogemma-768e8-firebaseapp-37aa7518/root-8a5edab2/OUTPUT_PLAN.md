# Output Plan — GeoGemma clone (Minerva-adapted)

- **Source URL:** https://geogemma-768e8.firebaseapp.com/ (`/` only, single URL)
- **App root:** `.` (repo root, single application)
- **Site-key:** `geogemma-768e8-firebaseapp-37aa7518` (origin slug + first 8 hex of SHA-256 over normalized origin)
- **Page-key:** `root-8a5edab2` (`root-` + first 8 hex of SHA-256 over `/`)
- **Destination route:** `/` (replaces existing homepage — explicitly approved by user 2026-09-26)
- **Preserved routes:** `/compro` untouched. Previous `/` content (`GLTFViewer` 3D dashboard) relocated to `/twin`, chrome intact.
- **Artifact root:** `docs/research/geogemma-768e8-firebaseapp-37aa7518/root-8a5edab2/`
- **Screenshot root:** `docs/design-references/geogemma-768e8-firebaseapp-37aa7518/root-8a5edab2/` (desktop-1440.png, mobile-390.png captured via headless Edge 2026-09-26)
- **Component root:** `src/components/sites/geogemma-768e8-firebaseapp-37aa7518/root-8a5edab2/`
- **Shared icons:** `src/components/sites/geogemma-768e8-firebaseapp-37aa7518/shared/icons.tsx`
- **Asset root:** `public/sites/geogemma-768e8-firebaseapp-37aa7518/root-8a5edab2/` (logo redrawn as SVG component — no brand binary copied)
- **Downloader script:** n/a (no binary assets extracted; tiles served live by CARTO/Esri, geocoding by Nominatim)
- **Adaptation mandate:** layout/topology/content-model faithful to reference; visual tokens mapped to Minerva identity (see TOKEN_MAP in PAGE_TOPOLOGY.md). No changes to `src/app/globals.css`. AppShell chrome (TopBar/BottomBar) suppressed on `/` only via pathname conditional; all other routes unchanged.
- **Backend:** out of scope. Chat, layers, auth, voice are client-side mocks with realistic canned data.
