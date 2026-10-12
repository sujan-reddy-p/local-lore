# Local Lore agent instructions

This is the entry point for any agent continuing the project. Work in this standalone repository; do not move it into another portfolio repository.

## Required reading order

1. `README.md`
2. `docs/agent-handoff.md`
3. `docs/architecture.md`
4. The focused guide for the area being changed
5. `docs/source-and-image-policy.md` before modifying catalog records, sources, images, or ingestion

- Preserve source URL, source name, source-check date, seed/live status, accessibility, price, and schedule context on every mission.
- `curated-seed` must never be presented as verified live data.
- The catalog publisher is agentic: an evidence-bearing researcher proposes strict structured changes and a deterministic validator/publisher writes a bounded Git snapshot. There is no mandatory human approval or review queue in the active publication path.
- Retain access controls, source terms, rate limits, image rights, security boundaries, and provenance. Public visibility or model confidence never grants permission.
- Never invent facts, prices, dates, coordinates, availability, accessibility, event details, or image rights. If evidence is incomplete, omit the field or skip the finding.
- Human correction/takedown workflows are future work and are not implemented now; preserve enough provenance to support a later correction path.
- Do not scrape a site unless its documented access conditions permit automation. Do not bypass authentication, CAPTCHA, paywalls, rate limits, robots controls, or other technical controls.
- Do not generate project images. Add a remote image only when reuse permission is known and every `MissionImage` field can be completed.
- Preserve keyboard support, visible focus, readable contrast, touch gestures, and reduced-motion behavior.

The historical `approved_for_display` and `needs_source_review` labels remain data lineage/eligibility state for existing records and sources. They are not a current human publication gate. The old database review/publication workflow is inactive; Neon/Postgres history remains documented as historical operational infrastructure.
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

- `components/local-lore-app.tsx` owns discovery/filter/selection state and camera actions. `components/map/mission-map.tsx` owns the MapLibre instance, source synchronization, hit resolution, and React hover portal.
- The style graph belongs in `lib/map-style.ts`; do not scatter layer definitions into React effects.
- Point locators retain a restrained halo when footprints are absent or visually tiny; it fades as a genuine loaded polygon becomes legible. Never fabricate boundaries.
- Keep `icon-pitch-alignment` and `icon-rotation-alignment` set to `viewport`. Preserve learned outlines across zooms and filter both sources using current visible IDs.
- Retain the local PMTiles archive and `pmtiles://` protocol. Avoid dependencies on a private map token.
- Update `docs/map-system.md` whenever IDs, zoom thresholds, bounds, controls, gesture behavior, or archive assumptions change.
- `lib/region.ts` is the shared geographic boundary and home camera for the map and ingestion validation.

## Frontend direction and ownership

- Keep a quiet city field guide: subdued geographic fills, thin outlines, upright subject artwork, readable previews. Buildings may extrude; activity areas stay ground-level. No ambient pulses, stock-image substitutes, or decorative controls.
- `components/discovery/discovery.css` owns the compact discovery panel and two-slider refinement; no gallery. `components/map/mission-map.css` owns hover styling; mission media owns image states, mission status owns source/timing evidence, and mission detail owns the selected card.
- Keep discovery controls together until they gain independent behavior; do not split every button into a component or build a generic UI framework.
- Frontend agents normally edit `components/`, `app/globals.css`, `lib/map-style.ts`, `lib/activity-zones.ts`, `lib/activity-artwork.ts`, `lib/mission-copy.ts`, and `public/map-icons/` with `scripts/generate-map-icons.mjs`. Backend/catalog agents own `app/api/`, `db/`, `drizzle/`, `data/`, source adapters, ingestion, and catalog scripts. Coordinate before changing shared `lib/types.ts`, `lib/region.ts`, `app/page.tsx`, or package files.
- Shared docs are integration points: make small targeted updates and preserve concurrent edits. Do not move backend files as part of a frontend cleanup.
- Verify successful, missing, loading, and failed photos; switch directly from a failed photo to another selected mission. Selected cards suppress their own hover preview; previews have no action. Check inline Info disclosure, source links, and filter/camera hover dismissal. Never insert catalog strings with `setHTML`.
- Product direction and upcoming event/road-trip acceptance are in `docs/roadmap-and-decisions.md`. Deliver complete user journeys, not isolated extra controls. Do not expose trip feasibility without real road routing, return-leg accounting, and approved destination facts.
- Discovery stays visible without a hamburger or scrolling interest/date rows. Filter only refines budget and approximate activity time; avoid duplicate category/trait/quick controls. Keep activity time separate from driving/trip duration.
- Card descriptions explain the actual activity in one short plain sentence, not a category label. `lib/mission-copy.ts` is frontend wording, not a second facts/schedule catalog. Keep photo, heading, readable time/cost/company facts, and one website action; source/accessibility/rights live behind Info.
- Follow the practical hierarchy, contrast, and copy review in `docs/design-system.md`; use real content and inspect screenshots rather than installing a generic design pack.
- `LocationControl` requests permission on deployed secure hosts, never loopback/localhost. Verify denial, outside coverage, retry, timeout, stale callbacks, and navigation preservation; no GPS storage or transmission. Preserve existing map gestures.
- Verify Bay Area dates across DST/weekend/year boundaries, arbitrary date-picker selections, and complete reset. Do not derive catalog calendar days from browser timezone or UTC day strings alone.


## Editing catalog data

- The publish boundary is `LoreItem` in `lib/types.ts`.
- Catalog content lives in `data/source-catalog.json`, grouped by source. `lib/seed-data.ts` adapts those groups to the `LoreItem` UI contract; do not hand-edit the adapter.
- Existing catalog records are `approved_for_display` under the maintainer’s explicit accuracy assumption for current site content. This is not an independent source audit, automated-fetch permission, or image-reuse permission.
- Preserve `catalogOrder`, source IDs, original seed-check dates, and image metadata. Validate with `npm run catalog:validate`.
- Neon/Postgres is for server-side operational state; do not require it to serve the current static catalog or expose its credentials to browser code.
- Coordinates are `[longitude, latitude]`, not the reverse.
- `zoneRadiusM` remains a legacy catalog hint; the frontend does not use it to infer physical boundaries. Do not remove it or migrate backend records during a frontend-only change.
- Open every new canonical source. Prefer official organizer, public agency, institution, or authorized public feed pages.
- Write original Local Lore framing; do not copy source descriptions.
- Run content checks described in `docs/catalog-and-data-model.md`.

## Local catalog discovery

- The active local workflow is `scripts/discover-catalog.mjs` plus `scripts/daily-discovery.mjs`; there is no GitHub scheduled workflow. The default research model is `openai-codex/gpt-6-luna` using locally authenticated OMP; override with `--model` or `LOCAL_DISCOVERY_MODEL`.
- Researcher assesses access from actual published terms and technical controls. No human approval queue is required, but access permission, source terms, rate limits, image rights, security, and provenance remain required. Never bypass access controls or invent facts.
- Raw proposals/evidence and other run outputs are ignored local files. Only final processed `data/source-catalog.json` and `data/discovery-state.json` may be committed by the daily runner.
- Daily publication requires a clean committed checkout, local branch equal to `origin`, installed dependencies, and authenticated local OMP. Research, validation, and builds run in an isolated ignored Git worktree, not the root `.next`; commits are limited to the two managed catalog/state paths. A push failure leaves the local commit in place and requires a deliberate push before another run.
- macOS launchd defaults to 08:17 local time. Install only from a durable `~/Projects/local-lore` clone with `npm ci`, then `npm run catalog:schedule -- install`; the installer refuses `/tmp` checkouts. Do not claim installation or a successful run without observed evidence.
- The baseline has 225 records; derive current counts from the catalog. The 350–500 distinct-experience range and 75 km Bay Area cutoff are research goals/limits, not achieved coverage claims. Route geometry requires actual sourced ordered geometry and is shown only on hover/selection; otherwise show route start-first. Dated events at grouped locations use a chooser.

## Editing future ingestion

- The active publication path is local-Mac-only agentic research documented in `docs/content-maintenance.md`: research produces strict structured findings, deterministic validation applies only source-backed changes in an isolated copy, and the daily wrapper may commit only processed catalog/state files. A failed fetch or “not seen” result preserves the existing good record; it does not mass-delete content.
- Source/record `reviewStatus` values describe lineage and eligibility evidence, not a mandatory human approval step. The former database candidate-review/publication commands are inactive historical paths; preserve their schemas and migration history when relevant, but do not route new content through them.
- AI may propose editorial framing and classification, but may not invent factual fields. Preserve provenance, source checks, rights, and security controls.
- Preserve event occurrences and source observations where present; expire past occurrences separately, and retire only explicit cancellations/closures with evidence.
- Do not activate public database reads or a remote scheduler without updating storage, deployment, source-policy, observability, and rollback documentation. macOS launchd scheduling is local and documented in the maintenance guide.

## Repository hygiene

- Do not commit `node_modules`, `.next`, `dist`, `.wrangler`, `.env*`, or local recovery folders.
- The PMTiles archive is intentionally committed and is about 29.5 MiB.
- Preserve unrelated work in a dirty working tree.
- Keep documentation aligned with implemented behavior. If code and docs disagree, fix both in the same change.
- Do not deploy or configure external services unless the user explicitly requests it.
