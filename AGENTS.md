# Local Lore agent instructions

This is the entry point for any agent continuing the project. Work in this standalone repository; do not move it into another portfolio repository.

## Required reading order

1. `README.md`
2. `docs/agent-handoff.md`
3. `docs/architecture.md`
4. The focused guide for the area being changed
5. `docs/source-and-image-policy.md` before modifying catalog records, sources, images, or ingestion

## Non-negotiable product invariants

- The map remains the primary full-viewport experience.
- Keep the interface account-free and low-friction.
- Missions are geographic activity zones, not generic pin markers.
- A category glyph must remain centered on its map coordinate while panning, rotating, tilting, and zooming.
- The view remains bounded to San Francisco and nearby Bay context defined by `SF_BOUNDS`.
- Preserve source URL, source name, source-check date, seed/live status, accessibility, price, and schedule context on every mission.
- `curated-seed` must never be presented as verified live data.
- Do not scrape a site unless its policy explicitly permits automation.
- Do not generate project images. Add a remote image only when reuse permission is known and every `MissionImage` field can be completed.
- Preserve keyboard support, visible focus, readable contrast, touch gestures, and reduced-motion behavior.

## Safe change workflow

```bash
npm install
npm run dev
```

After editing, run:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
```

For map or responsive changes, inspect the running page at desktop and mobile widths. Confirm map health, no console errors, PMTiles range requests, labels, 3D buildings, gestures, filters, hover, mission selection, and the source link.

## Editing map code

- Map construction and UI state live in `components/local-lore-app.tsx`.
- The style graph belongs in `lib/map-style.ts`; do not scatter layer definitions into React effects.
- Point and polygon GeoJSON belong in `lib/activity-zones.ts` and derive from the same `LoreItem.coordinates`.
- Keep `icon-pitch-alignment` and `icon-rotation-alignment` set to `viewport` unless deliberately redesigning glyph behavior.
- Retain the local PMTiles archive and `pmtiles://` protocol. Avoid dependencies on a private map token.
- Update `docs/map-system.md` whenever IDs, zoom thresholds, bounds, controls, gesture behavior, or archive assumptions change.

## Editing catalog data

- The publish boundary is `LoreItem` in `lib/types.ts`.
- V1 records live in `lib/seed-data.ts`; keep the file deterministic and statically importable.
- Coordinates are `[longitude, latitude]`, not the reverse.
- Verify that `zoneRadiusM` reflects the real activity footprint.
- Open every new canonical source. Prefer official organizer, public agency, institution, or authorized public feed pages.
- Write original Local Lore framing; do not copy source descriptions.
- Run content checks described in `docs/catalog-and-data-model.md`.

## Editing future ingestion

- Adapters implement `SourceAdapter`; do not make the UI understand source-specific schemas.
- Automation must be gated by source policy.
- AI may propose editorial framing and classification, but may not invent factual fields.
- Records that fail confidence, provenance, location, duplicate, or expiry checks enter review.
- Do not enable database writes or a scheduler without updating storage, deployment, source-policy, observability, and rollback documentation.

## Repository hygiene

- Do not commit `node_modules`, `.next`, `dist`, `.wrangler`, `.env*`, or local recovery folders.
- The PMTiles archive is intentionally committed and is about 29.5 MiB.
- Preserve unrelated work in a dirty working tree.
- Keep documentation aligned with implemented behavior. If code and docs disagree, fix both in the same change.
- Do not deploy or configure external services unless the user explicitly requests it.
