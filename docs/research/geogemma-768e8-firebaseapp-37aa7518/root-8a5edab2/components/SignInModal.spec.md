# SignInModal Specification

## Overview
- **Target file:** `.../SignInModal.tsx`
- **Screenshot:** desktop-1440.png + mobile-390.png (centered card over dimmed app)
- **Interaction model:** dismissible gate (mock auth)

## DOM Structure
Fixed overlay (bg-black/70 backdrop-blur-sm, z-[100]) > card (w-[420px] max-w-[calc(100vw-2rem)] rounded-xl bg-[#10192e] border white/10 shadow-2xl): header row "Sign In Required" + X; body text "Please sign in to use GeoGemma's features."; "G Sign in with Google" button.

## Computed Styles (adapted)
- Header: px-5 py-4 font-semibold slate-100 border-b white/10; X ghost slate-400.
- Body: px-5 py-6 text-center text-sm slate-300.
- Google button: mx-auto flex gap-2 bg-white text-slate-900 font-medium rounded-lg px-5 py-2.5 hover bg-slate-200 (G multicolor SVG).

## States & Behaviors
- Shows once (localStorage `geogemma-mock-auth`); X/backdrop dismiss without auth (guest mode, avatar stays "U").
- Sign-in button: 600ms fake progress → sets mock user "Guest Researcher", dismisses, header chip shows avatar.
- No OAuth, no network. Esc closes.

## Text Content — verbatim from reference. Responsive — card margins on 390px.
