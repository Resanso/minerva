# MapView Specification

## Overview
- **Target file:** `.../MapView.tsx`
- **Screenshot:** desktop-1440.png (center canvas)
- **Interaction model:** continuous (pan/zoom) + click tools

## DOM Structure
`div.absolute.inset-0` (below header, between rails) > maplibre container div (ref pattern) + floating controls:
- top-left: NavigationControl (zoom in/out, compass; pitch visualize off).
- top-right: FullscreenControl, GeolocateControl.
- bottom-left: ScaleControl; bottom-right: AttributionControl compact (OpenStreetMap, CARTO).
- Right-middle: basemap toggle FAB ("Change basemap": map/satellite icon) + drawing-tools FAB (pencil-ruler, "Open drawing tools").

## Computed Styles (adapted)
- Canvas fills region; controls default MapLibre styled via `maplibre-gl.css` + wrapper overrides to dark (bg #10192e, slate-200 icons).
- FABs: 48px rounded-full, bg #10192e border white/10 text-blue-400 shadow-xl, hover scale-105.

## States & Behaviors
- Sources: CARTO `dark_all` raster + Esri World Imagery raster; toggle swaps source preserving center/zoom; label/tooltip updates.
- Geolocate: browser API; denied → inline notice bottom-center, auto-dismiss 4s.
- Place-point mode (from drawing FAB or Inspect panel): cursor crosshair; next click drops blue marker + popup "lng, lat (5dp)"; Esc or second arm-click disarms. Markers listed nowhere (transient, documented simplification).
- Inspect-pixel mode: click shows popup with mock band values (B04/B08/NDVI pseudo-random seeded by coords — deterministic, clearly mock).
- Initial view: [106.8, -6.2] (Jakarta) z3? Reference default world view — use lng 20, lat 20, zoom 1.5 world view to match reference screenshot (world extents). Choose world view.

## Assets — live tiles (no download). Attribution preserved.
## Text Content — control titles, "1000 km" scale (auto), attribution links.
## Responsive — controls shrink on 390px (MapLibre touch handlers on).
