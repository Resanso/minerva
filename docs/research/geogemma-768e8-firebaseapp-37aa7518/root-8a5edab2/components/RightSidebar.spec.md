# RightSidebar Specification

## Overview
- **Target file:** `.../RightSidebar.tsx`
- **Screenshot:** desktop-1440.png (right strip)
- **Interaction model:** click-driven panel switch + list management

## DOM Structure
`aside.fixed.right-0.top-14.bottom-0` collapsed strip (w-[60px]) with icons Layers/Inspect/Information/Fullscreen; expanded panel w-[380px] (mobile: full-width overlay) bg #0c1220 border-l white/10:
- Layers: "Manage Your Layers" title, query input ("Enter a query to add a layer"), rows (color dot, name, meta, eye, up/down, trash), "Clear All Layers" danger-ghost button, empty state "No layers available".
- Inspect: two action rows ("Click on the map to inspect pixel values", "Click on the map to place a point") arming map modes; readout box for last result.
- Information: about GeoGemma text + data credits (MapLibre, CARTO, Esri, OSM, Nominatim, Data Commons) + "Powered by Data Commons" link.

## Computed Styles (adapted)
- Panel header: text-sm font-semibold slate-100; section labels uppercase 12px slate-500.
- Rows: rounded-lg border white/5 bg-white/[0.03] px-3 py-2; hover border-blue-500/40.
- Inputs: bg-white/5 border white/10 rounded-lg text-sm, focus blue-500 ring.

## States & Behaviors
- Icon click toggles panel (click active icon collapses). Fullscreen icon toggles document fullscreen directly.
- Add-layer query: keyword match (ndvi/gdp/co2 or place name) → adds mock layer + map source; unknown → inline error "No mock layer matched — try 'NDVI Paris' or 'GDP Asia'".
- Clear all: empties layers + map sources, inline confirm notice.
- Reorder up/down swaps order + moves map layer order to match.

## Assets — none. Text Content — English strings above (verbatim from reference where noted).
## Responsive — overlay full-width on <768px with close button.
