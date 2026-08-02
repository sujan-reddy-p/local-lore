# Agent handoff

## Project snapshot

Local Lore V1 is a standalone Next.js App Router project in active portfolio condition. It is a single-page, full-viewport map experience with 112 static San Francisco and nearby Bay missions. The map, catalog filters, hover previews, mission drawer/card, responsive layout, source attribution, local vector tiles, and both production build targets are implemented.

No deployment was performed as part of the original build. Persistence, scheduled ingestion, live feeds, and an AI review system are designed but not activated.

## Last implemented product changes

- Removed the full-width top bar so the map uses the complete viewport.
- Preserved identity in a compact map-overlay brand block.
- Removed MapLibre’s native plus/minus controls. Scroll, pinch, double-click, keyboard, and box zoom remain available.
- Grouped exactly three right-side map controls: rotate, cycle tilt/top-down, and restore the whole-city view.
- Increased curiosity-filter type size and added Lucide icons.
- Added an All-time calendar choice. All time passes `null` to the matcher and intentionally skips `isAvailableOn`, exposing all 112 missions.

## Known-good behavior

- Initial camera: center `[-122.425, 37.78]`, zoom `11.8`, pitch `44`, bearing `-12`.
- Bounds: southwest `[-122.61, 37.61]`, northeast `[-122.26, 37.93]`.
- Map style and local PMTiles load in Next development mode.
- 3D building extrusion appears beginning at zoom 11 and reaches data height by zoom 12.7.
- Mission clusters operate through zoom 13; individual detailed zones begin near zoom 12.2.
- Mission symbols are anchored to geographic coordinates but aligned to the viewport, so they stay upright and centered while the map pitches or rotates.
- Hover updates the zone-hover filter and opens a compact source-derived preview.
- Clicking a zone or glyph selects the corresponding `LoreItem` and eases the camera to it.
- Mobile supports one-finger pan and two-finger zoom, pitch, and rotation.
- Reduced-motion mode disables the pulse loop and compresses interface animation durations.
- Filter synchronization targets the two MapLibre GeoJSON source objects directly. Do not reintroduce a separate React load-state gate; it previously allowed counts to update while map features stayed stale.

## Truth about the data

- `lib/seed-data.ts` contains exactly 112 hand-authored seed records.
- The shared source-check date is `2026-08-02`.
- Every record’s status is `curated-seed`; none is verified live.
- Every record contains a source name and direct HTTPS URL.
- Three records include externally hosted Wikimedia Commons images with stored credit, source page, and license. No generated images are used.
- Recurring and evergreen availability is partly inferred from `timeSlot` when a record has no explicit schedule. This is acceptable for a prototype but must be replaced by source-accurate schedules in a live catalog.

## Architecture status

Implemented now:

- Typed `LoreItem` and schedule/image/source contracts.
- Approved-source policy and adapter interface.
- Pure adapter-run pipeline with normalization, stable IDs, confidence threshold, bounds validation, dedupe, expiry, and review output.
- Drizzle SQLite schema and initial migration.

Designed but not connected:

- Concrete official-feed adapters.
- Scheduler or cron trigger.
- Persistent adapter runs and missions.
- Review/admin interface.
- AI invocation.
- Publish/unpublish transaction.
- Freshness display backed by the latest successful run.

## Important hosting risk

`public/maps/san-francisco.pmtiles` is 30,915,385 bytes and MapLibre reads it through HTTP range requests. A host that omits or mishandles `Content-Length`, `Content-Range`, or byte ranges will produce a blank map even when the application JavaScript works. The Next/Vercel build succeeds, but the deployed range response must still be smoke-tested. A previous local vinext production-server attempt exposed a range/content-length incompatibility; Next development mode worked. Follow `docs/deployment.md` exactly.

## External dependencies and network behavior

- The vector archive and favicon are local.
- Protomaps glyph PBF files come from `https://protomaps.github.io/basemaps-assets/fonts/…`; labels require network access.
- Three optional mission photos come from Wikimedia Commons redirects.
- Mission source links go to external organizers/agencies only when the visitor chooses them.
- There is no private Mapbox token, API key, analytics SDK, authentication, or backend call in the core V1 path.

## Recommended next work

1. Deploy a preview and prove PMTiles range behavior on the exact host.
2. Add a lightweight automated map smoke test in a real browser.
3. Self-host Protomaps glyphs for a fully local visual base.
4. Implement one permissioned official-feed adapter end-to-end before increasing architecture surface.
5. Add persistence and a review queue only after the one-adapter flow is trustworthy.
6. Add freshness and live/seed badges at the catalog boundary.
7. Improve date precision and time-zone handling.
8. Split or lazy-load the MapLibre client path if bundle size becomes a release concern.
9. Design and implement the requested light theme without weakening map contrast.

## Do not accidentally regress

- Do not restore the full-width header or native plus/minus map controls.
- Do not convert zones back into ordinary pins.
- Do not show mission titles permanently on the map; titles appear on hover/select.
- Do not put source-specific data parsing in the React component.
- Do not call a seed record live because it has an organizer link.
- Do not silently substitute generated or unlicensed imagery.
- Do not remove map attribution.
- Do not widen bounds so far that the city becomes a small island in an empty backdrop.
