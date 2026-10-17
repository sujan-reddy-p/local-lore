# Local Lore agent instructions

This is the entry point for any agent continuing the project. Work in this standalone repository; do not move it into another portfolio repository.

## Required reading order

1. `README.md`
2. `docs/agent-handoff.md`
3. `docs/architecture.md`
4. The focused guide for the area being changed
5. `docs/source-and-image-policy.md` before modifying catalog records, sources, images, or ingestion

- Preserve source URL, source name, source-check date, seed/live status, accessibility, price, and schedule context on every mission.
- The catalog is maintained only by a manually invoked OMP skill with user-controlled Git publication. No JavaScript researcher/publisher or automatic schedule/commit/push is active. There is no mandatory human approval queue.
- Retain access controls, source terms, rate limits, image rights, security boundaries, and provenance. Public visibility or model confidence never grants permission.
- Never invent facts, prices, dates, coordinates, availability, accessibility, event details, or image rights. If evidence is incomplete, omit the field or skip the finding.
- Human correction/takedown workflows are future work and are not implemented now; preserve enough provenance to support a later correction path.
- Do not scrape a site unless its documented access conditions permit automation. Do not bypass authentication, CAPTCHA, paywalls, rate limits, robots controls, or other technical controls.
- Do not generate project images. Add a remote image only when reuse permission is known and every `MissionImage` field can be completed.
- Preserve keyboard support, visible focus, readable contrast, touch gestures, and reduced-motion behavior.

The historical `approved_for_display` and `needs_source_review` labels remain data lineage/eligibility state for existing records and sources. They are not a current human publication gate. The old database review/publication workflow is inactive; Neon/Postgres history remains documented as historical operational infrastructure.

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
- Frontend agents normally edit `components/`, `app/globals.css`, `lib/map-style.ts`, `lib/activity-zones.ts`, `lib/activity-artwork.ts`, and `public/map-icons/` with `scripts/generate-map-icons.mjs`. Backend/catalog agents own `app/api/`, `db/`, `drizzle/`, `data/`, source adapters, ingestion, and catalog scripts. Activity descriptions are canonical catalog content; coordinate editorial changes with the catalog owner. Coordinate before changing shared `lib/types.ts`, `lib/region.ts`, `app/page.tsx`, or package files.
- Shared docs are integration points: make small targeted updates and preserve concurrent edits. Do not move backend files as part of a frontend cleanup.
- Verify successful, missing, loading, and failed photos; switch directly from a failed photo to another selected mission. Selected cards suppress their own hover preview; previews have no action. Check inline Info disclosure, source links, and filter/camera hover dismissal. Never insert catalog strings with `setHTML`.
- Product direction and upcoming event/road-trip acceptance are in `docs/roadmap-and-decisions.md`. Deliver complete user journeys, not isolated extra controls. Do not expose trip feasibility without real road routing, return-leg accounting, and approved destination facts.
- Discovery is hidden by default behind an accessible hamburger. Keep state when closed, remove hidden controls from interaction, focus search on opening, and restore the trigger on closing. The opened panel keeps interests and dates compact; filters only refine budget and approximate activity time.
- Card descriptions explain the actual activity in one short plain sentence, not a category label, and render `record.description` directly. Never add a frontend ID-to-description override that hides future catalog corrections. Keep photo, heading, readable time/cost/company facts, and one website action; source/accessibility/rights live behind Info.
- Follow the practical hierarchy, contrast, and copy review in `docs/design-system.md`; use real content and inspect screenshots rather than installing a generic design pack.
- `LocationControl` requests permission on deployed secure hosts, never loopback/localhost. Verify denial, outside coverage, retry, timeout, stale callbacks, and navigation preservation; no GPS storage or transmission. Preserve existing map gestures.
- Verify Bay Area dates across DST/weekend/year boundaries, arbitrary date-picker selections, and complete reset. Do not derive catalog calendar days from browser timezone or UTC day strings alone.


## Editing catalog data

- The publish boundary is `LoreItem` in `lib/types.ts`.
- Catalog content lives in `data/source-catalog.json`, grouped by source. `lib/seed-data.ts` is a server-side display projection: never import it or the raw catalog from client/map modules, and never serialize audit evidence, candidate state, or coordinate-research receipts to the browser.
- Existing catalog records are `approved_for_display` under the maintainer’s explicit accuracy assumption for current site content. This is not an independent source audit, automated-fetch permission, or image-reuse permission.
- Preserve `catalogOrder`, source IDs, original seed-check dates, and image metadata. Validate with `npm run catalog:validate`.
- Neon/Postgres is for server-side operational state; do not require it to serve the current static catalog or expose its credentials to browser code.
- Coordinates are `[longitude, latitude]`, not the reverse.
- `zoneRadiusM` remains a legacy catalog hint; the frontend does not use it to infer physical boundaries. Do not remove it or migrate backend records during a frontend-only change.
- Open every new canonical source. Prefer official organizer, public agency, institution, or authorized public feed pages.
- Write original Local Lore framing; do not copy source descriptions.
- Run content checks described in `docs/catalog-and-data-model.md`.

## Local catalog discovery

- Catalog maintenance is a manually invoked OMP GPT-6 Luna skill in `.claude/skills/local-discovery/SKILL.md`; exact invocation is in README and `docs/content-maintenance.md`. No JavaScript research/publisher runner, automatic schedule, LaunchAgent, automatic commit, or automatic push. The user decides when to trigger and publish.
- Maintain the full configured inventory with bounded parallel workers; record checked/failed/unchanged outcomes in discovery state. A failed read or not-seen result preserves the good record. Expire dated occurrences separately and retire only on explicit evidence.
- Apply the 75 km geodesic radius and Bay Area bounds, plus actual city boundaries for city counts. Cover neighborhoods, South San Francisco, Pacifica, Half Moon Bay, nearby coasts and open space—not just city polygons. Target 100 distinct worthwhile things to do per major city, not 100 upcoming events; no filler or repeated outings.
- Every discovery/refresh worker researches event image, suitable venue image, then logo. Download suitable candidates into ignored `outputs/image-review/`, outside `public/`, and record source/credit/hash/status. During this data-first round, stage new images privately without spending the assignment on permission research or adding them to the website. Never invent permission; existing media remains displayed.
- Derive current counts from the catalog and actual city boundaries. Report place/activity, ongoing-program, and upcoming-event counts separately; repeated occurrences do not inflate coverage. Routes use sourced ordered geometry; geocoded connections are marked `routeType: "connection"` and dashed/directed, shown only on focus. All hover cards must use one read-only layout; clicking opens details directly, never a shared-venue chooser.
- Research is authorized, but the latest local Luna workers again returned `usage_limit_reached`; `data/discovery-state.json` records the current blocker and partial results. Do not infer continuing availability from the earlier reset, silently switch models, or claim unfinished research complete. Complete data/source quality and coverage before the final UI/design pass; road-trip planning is deferred. The authoritative discovery skill defines breadth, complete-candidate gates, and bounded worker supervision. Map-only POIs and generic walks remain leads, not quota-filling missions.

## Editing future ingestion

- `lib/ingestion/` and database candidate-review/publication paths are historical; preserve their schemas and migration history, but do not use them to publish static catalog content. Source/record `reviewStatus` values remain lineage and eligibility evidence, not mandatory approval.
- No discovery schedule or automation is installed or supported; catalog maintenance occurs only when explicitly invoked by the user.

## Repository hygiene

- Do not commit `node_modules`, `.next`, `dist`, `.wrangler`, `.env*`, or local recovery folders.
- The committed regional PMTiles archive is about 87.6 MiB. Preserve its source attribution and license; do not replace it with the older city-only archive.
- Preserve unrelated work in a dirty working tree.
- Keep documentation aligned with implemented behavior. If code and docs disagree, fix both in the same change.
- Do not deploy or configure external services unless the user explicitly requests it.
