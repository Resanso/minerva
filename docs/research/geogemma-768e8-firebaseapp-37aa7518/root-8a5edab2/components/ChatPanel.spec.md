# ChatPanel Specification

## Overview
- **Target file:** `.../ChatPanel.tsx`
- **Screenshot:** behind auth in reference; reconstructed from JS strings + CSS rules
- **Interaction model:** submit-driven thread, overlay panel

## DOM Structure
Floating panel left-bottom above PromptBar (w-[420px] max-w-[calc(100vw-2rem)], max-h-[60vh], rounded-xl bg-[#0c1220]/95 border white/10 shadow-2xl flex col; header "GeoGemma" + mode tag + close):
- Welcome state: "Welcome to GeoGemma" + greeting + "Try asking:" + 3 suggestion chips + "Powered by Data Commons" link.
- Thread: user bubbles right (blue-600, "U" avatar) / assistant bubbles (icon + react-markdown content), fade/slide-in, auto-scroll to bottom, typing indicator (3 dots).
- Footer mini-input mirrors PromptBar submit (same handler).

## Computed Styles (adapted)
- User bubble rounded-2xl rounded-br-sm; assistant bg-white/5 rounded-2xl rounded-bl-sm; text-sm leading-relaxed.
- Chips: rounded-full border blue-500/40 text-blue-300 text-xs px-3 py-1.5 hover bg-blue-600/20.

## States & Behaviors
- Suggestion click submits verbatim. History per chat session (switching history item loads its thread; new chat resets).
- Canned replies keyed by keywords (population/gdp/co2/ndvi/compare) + fallback; each reply may attach a mock layer (adds to Layers + map).
- Markdown rendered (bold, lists, inline code, links). No streaming (single append after delay — documented simplification).

## Text Content — English strings verbatim from reference bundle (see mock-data.ts).
## Responsive — bottom sheet full-width on mobile.
