# PromptBar Specification

## Overview
- **Target file:** `.../PromptBar.tsx`
- **Screenshot:** desktop-1440.png (bottom-center pill)
- **Interaction model:** submit-driven

## DOM Structure
Floating `form` bottom-6 centered, max-w-2xl w-[calc(100%-3rem)]: search icon left, text input ("Search for Earth imagery..."), mic button ("Voice search"), send button ("Search").

## Computed Styles (adapted)
- Pill: rounded-full bg-[#10192e]/95 backdrop-blur border white/10 shadow-2xl px-2 py-2 flex gap-1.
- Input: flex-1 bg-transparent text-sm slate-100 placeholder slate-500, focus outline none.
- Send: 36px rounded-full bg-blue-600 text-white hover bg-blue-500 + glow; disabled (empty) opacity-40.
- Mic: 36px rounded-full ghost slate-400 hover white.

## States & Behaviors
- Submit geographic query → MapView flies to Nominatim result + drops marker; informational query → ChatPanel thread reply flow (typing indicator ~900ms, canned markdown).
- Voice: uses webkitSpeechRecognition if present (fills input); else disabled + tooltip "Voice input not supported in this browser".
- Enter submits; Shift+Enter n/a (single-line). Empty submit ignored.

## Text Content — placeholder + titles verbatim. Responsive — full-width margins on 390px.
