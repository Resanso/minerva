# LeftSidebar Specification

## Overview
- **Target file:** `.../LeftSidebar.tsx`
- **Screenshot:** desktop-1440.png (left rail)
- **Interaction model:** click-driven expand/collapse + mode switch

## DOM Structure
`aside.fixed.left-0.top-0.h-full` (w-[60px] collapsed / w-[260px] expanded, bg #0c1220, border-r white/10, z-50, flex col)
- Top: chevron toggle (Expand sidebar / Collapse).
- Icon group: Chat (active state), Earth Agent, New chat.
- Expanded body: "New chat" CTA button + "Chats" section label + history list (title ellipsis, active highlight, hover actions rename/delete) + "Explore" hint.
- Bottom group: Time Series Analysis, Comparison Analysis, Add Custom GeoJSON, Export Data — disabled + "(Coming Soon)" tooltip.

## Computed Styles (adapted)
- Rail buttons: 40px square, rounded-md, slate-400 icons; active: bg blue-600/20 text-blue-400; hover: bg-white/5 (ref hover #2a2a2a).
- Chat item: px-3 py-2 rounded-md text-sm slate-200; active bg-white/10; hover actions appear on group-hover.
- Width transition .3s ease; content fades in when expanded.

## States & Behaviors
- Click chevron or Chat icon toggles expanded (left mode = history). Earth Agent icon switches thread to agent mode. New chat icon/button starts fresh thread (clears messages, keeps history entry).
- Rename: inline input, Enter commits, Esc cancels. Delete: removes + toast-less inline confirm (single click + undo not required; keep simple confirm via double-state button).
- Disabled buttons: `aria-disabled`, tooltip "Coming Soon", no-op click.

## Assets — icons from shared/icons.tsx.
## Text Content — "New chat", "Chats", history titles (mock), "Coming Soon".
## Responsive — stays 60px rail on mobile; expanded = overlay w-[280px] + backdrop.
