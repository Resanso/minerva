# Pivot note (2026-09-26) — factory content keeps GeoGemma chrome

User correction: the GeoGemma clone must NOT replace factory content. Final mapping:

- `/` = Minerva factory dashboard (GLTFViewer, LiveSensorTicker, simulation
  transport, product data, notifications, Ask AI) presented in GeoGemma-style
  chrome (`src/components/factory-shell/`). See `FACTORY_SHELL.md`.
- `/geogemma` = the GeoGemma clone built earlier (preserved verbatim).
- `/twin` = previous homepage with legacy chrome (left as fallback).
- `/compro` = untouched.

Net change to OUTPUT_PLAN.md: destination route of the clone is `/geogemma`,
not `/`. Everything else in that plan still holds.
