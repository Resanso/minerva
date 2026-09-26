# TopHeader Specification

## Overview
- **Target file:** `src/components/sites/geogemma-768e8-firebaseapp-37aa7518/root-8a5edab2/TopHeader.tsx`
- **Screenshot:** `docs/design-references/.../desktop-1440.png` (top strip)
- **Interaction model:** static

## DOM Structure
`header.fixed.top-0` (h-14/56px, left offset = left rail width) > left: logo mark (SVG globe) + "GeoGemma" wordmark; right: "Dataset Explorer" button (grid icon) + user chip (avatar circle + name, opens nothing / tooltip).

## Computed Styles (from reference CSS, Minerva-adapted)
- Container: fixed, h-56px, bg #0c1220 (ref #181818), border-b white/10, px-4, z-40, flex justify-between.
- Wordmark: 18px semibold slate-100, Geist (ref Product Sans → Geist per adaptation).
- Dataset button: px-5 py-2, bg white/5 border white/10 rounded-lg text-sm slate-100, hover bg white/10 + blue-500/40 ring focus.

## States & Behaviors
- Hover on button: bg lift. Click: opens right Layers panel (documented deviation from reference external link).
- Left offset animates 60px ↔ 260px with sidebar (transition all .3s ease).

## Assets — none (logo redrawn SVG in shared/icons.tsx).
## Text Content — "GeoGemma", "Dataset Explorer", user name.
## Responsive — 1440: full; 390: wordmark hidden (icon only), button compact.
