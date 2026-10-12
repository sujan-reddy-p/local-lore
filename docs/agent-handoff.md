# Agent handoff

> This is the living context document for Local Lore. Update it in the same
> change whenever the runtime, deployment path, catalog contract, map behavior,
> test commands, known limitations, or ownership boundaries change.

**Last updated:** 2026-10-12
**Current branch:** `master`
**Repository:** `https://github.com/sujan-reddy-p/local-lore`
**Production:** `https://local-lore-five.vercel.app`

## Agentic snapshot baseline — 2026-10-12

- The bundled website catalog now contains 225 records in 178 source groups. Actual local research published 13 new Berkeley/San José/San Francisco activities and occurrences, plus supported refreshes. The original evergreen records remain; dated events have separate IDs.
- Publication is local OMP research → deterministic stage/apply → Git catalog/state. No mandatory human approval gate, remote research cron, or database catalog importer remains. External access policies, image rights, and source evidence still apply.
- Default researcher: `openai-codex/gpt-6-luna`; complex initial nearby research used an explicit `openai-codex/gpt-6.1-sol` override. Local credentials and raw research stay outside Git.
- Map scenes share clustered/grouped anchors, truthful native footprints, small/absent-footprint halos, and source-backed start-first routes. Native event callbacks read current catalog/visibility through React Effect Events; data refreshes preserve the map instance, camera, and selected ID.
- Actual Chromium checks covered desktop 1440×1000 and mobile 390×844/320×568, grouped secondary selection, new San José event dates, known-free versus unknown-price filtering, failed-photo artwork fallback, and 225-record scene retention through catalog updates.
- Catalog validation, lint, strict TypeScript, production build, and 26 behavioral tests passed during integration. The share image uses the same local artwork badges rather than unsupported Unicode glyphs.
- Maintained checkout: `~/Projects/local-lore`; future agents should work there, not in the retained `/tmp` clone. Baseline `10f73d6` was pushed to `master`; localhost `http://localhost:4317` remains running from the durable checkout.
- macOS launchd `com.local-lore.discovery` is installed for 08:17 local time. Both the manual daily command and an actual launchd-triggered run completed research, stage/apply, and catalog validation as no-ops with 225 records retained. Local rotation/check state advanced outside Git; neither run invented findings or changed Git.
- Daily runs require a clean, up-to-date durable checkout and use isolated Git worktrees. Changed snapshots must pass lint, strict TypeScript, build, and tests before publication; no-ops validate the catalog without rebuilding it. See `docs/local-agent-automation.md` and `docs/content-maintenance.md`.
- The 350–500 experience range is an ongoing coverage goal, not the current count. Some official pages return 403/404 or lack usable facts/geodata; preserve existing records and record omissions rather than fabricate replacements.

## Historical production context — last verified 2026-10-11

Local Lore is a deployed, single-page Next.js map experience. Its catalog is static at runtime: `data/source-catalog.json` is adapted by `lib/seed-data.ts`, rendered over the local regional PMTiles map, and not fetched from sources or AI. The server-only visitor route writes raw-IP visitor records to Neon only when database environment variables are configured.

Local development and Vercel production now use the same native Next.js runtime. The local development server is pinned to port `4317`:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:4317`. Do not reintroduce Vinext, Wrangler, a Cloudflare Worker, or a second local asset server unless the hosting decision changes and this document is updated first.

The 212 existing entries remain static in the site. The maintainer explicitly said to assume the current site content is accurate, so records are `approved_for_display` under that assumption—not an independent source audit. This does not grant automated-fetch or image-reuse permission. All four PostgreSQL migrations are applied, and the catalog importer synchronized 165 sources plus those 212 records. One source group remains `needs_source_review` and disabled; 32 pre-existing published mission rows for that source are retained but excluded by source-review gates. No source passes the current automated-fetch gates; no fetch or scheduler has run, and the deployed page still does not read database event data.

## First reading order

1. `README.md`
2. `AGENTS.md`
3. this file
4. `docs/local-agent-playbook.md` for catalog work
5. `docs/source-and-image-policy.md` before changing sources, facts, or images
6. the focused map, UX, analytics, or deployment guide

## What works

- Full-viewport MapLibre map with local `public/maps/san-francisco-region.pmtiles`.
- Bay Area bounds in `lib/region.ts`, 3D buildings that ramp from flat at zoom 10 to full source height at zoom 12, pan, zoom, rotate, tilt, regional reset, clusters, zones, hover previews, and source links.
- 212 curated-seed San Francisco missions, map-driven filtering, Any day default, responsive map-first layout, reduced-motion support, and source disclosure.
- Compact search panel with eight visible interests, bottom Bay Area dates, and budget/activity-time-only refinement (travel excluded). No hamburger, gallery, duplicate category/trait/quick controls, or scrolling interest rows; Reset all clears date and filter constraints.
- OpenStreetMap/Protomaps attribution is visible on the map.
- PostHog browser provider: automatic capture and session replay activate only when `NEXT_PUBLIC_POSTHOG_KEY` is configured at build time.
- Accepted containing PMTiles building/landuse outlines preserve holes, reject oversized/native-tile-clipped fragments, and persist across zooms with size-aware fading. They are basemap context, not independently verified venue boundaries; unknown areas use subject-specific point artwork, never invented circular footprints.
- React hover previews share truthful image states and short activity explanations with selected cards; no Explore action and no selected-item hover duplicate. Selected cards have readable time/cost/company facts, one website action, and inline Info for source/accessibility/photo provenance. Missing/error photos use a compact artwork fallback. Selection focuses at least zoom 15.5; max camera zoom18 over native zoom14 tiles, with existing gestures unchanged.
- Deployed secure hosts request browser geolocation and offer retry; localhost/loopback hide the control and never request location. Denial/outside coverage preserve the camera, and late/stale callbacks cannot replace user navigation. No GPS is stored or transmitted.

Frontend verification (2026-10-11, current cutover): lint, strict TypeScript, production build, and all 13 existing catalog/ingestion/audit tests passed. Live production Chromium surfaces were inspected at 1440×1000, 390×844, and 320×568: eight interests and date controls without panel/horizontal scrolling; selected photo/card hierarchy; source/photo provenance hidden by default and available through Info; no selected hover duplicate. Native sliders at Free/1h matched exactly 26 catalog records. Zero-match filtering removed both sources, reset restored all 212 points, and a native input/change date scenario selected 2026-12-31 and reset correctly.

Map smoke retained the same nine-vertex Ina Coolbrith outline through zoom14→13→16→18, with 11 learned shapes retained and zero activity-zone source events over 2.5 seconds of settled idle. Artwork images for vinyl/running/garden were loaded. Actual map clicks exercised hover and selected cards; a deliberately blocked Asian Art photo used a 96px fallback, and direct selection of Amoeba recovered its real 190px photo and concise explanation.

Location smoke used a secure HTTPS fixture reverse-proxied to local production assets, native Chromium permission overrides/device coordinates, and no visitor API writes: allowed location centered at zoom12.5, native denial retained the effective bounded home camera, permission retry recovered, and New York coordinates left that same camera untouched. Separate simulated timeout/stale-callback scenarios preserved an actual Zoom-in interaction and permitted a fresh retry. Localhost made zero GPS calls and rendered no location control. The expected blocked-photo request and fixture transport teardown failures were not product JS exceptions. Physical-device multitouch and a public deployment were not tested.

The deployed-location visual pass also reproduced a status popover covering the search/filter row. Status now flows inside the header with concise denial copy. Final native-permission smoke at 390px and 320px confirmed zero status/search overlap, no horizontal/panel overflow, an operable Filter button, and successful location retry after the fix. Lint, strict TypeScript, production build, and all 13 tests passed after this correction.

Earlier date smoke covered SF day boundaries, Saturday/Sunday weekends, spring/fall DST, year changes, expiry, and malformed dates. This frontend cutover does not alter backend storage, ingestion, catalog, source permissions, or existing photo assets. Dated-event publication and actual routed road trips remain explicit future acceptance in `docs/roadmap-and-decisions.md`, not capabilities of the current static ideas.

## Recent runtime cleanup

The former Cloudflare/Vinext path was removed because it duplicated the Vercel runtime and could stall silently during local startup. The supported commands are now:

| Command | Meaning |
|---|---|
| `npm run dev` | Next.js webpack development server on port 4317 |
| `npm run build` | Native Next.js production build |
| `npm run build:vercel` | Native Next.js production build used by Vercel |
| `npm run start` | Native Next.js production server on port 4317 |
| `npm test` | Vercel build plus Node architectural tests |

The removed files were `vite.config.ts`, `worker/index.ts`, `build/sites-vite-plugin.ts`, `scripts/serve-local.mjs`, and `.openai/hosting.json`. The removed direct development dependencies were Vinext, Vite, Wrangler, the Cloudflare Vite plugin, and their direct React/Vite bridge packages.

The unrelated nested portfolio preview project was removed from this repository's workspace boundary and preserved intact at `/Users/sujan/Documents/local-lore-recovery/portfolio-preview-2026-08-06`. It is not a Local Lore dependency and must not be copied back into this repository. Generated `.next`, `.vinext`, `.wrangler`, and recovery output are ignored and disposable; source, catalog, images, and docs remain the only project-owned inputs.

## Architecture invariants

- Show evidence-based basemap area context where complete and appropriately sized; otherwise keep a restrained visible soft-circle locator (not a boundary).
- Subject artwork remains centered and viewport-aligned through pan, zoom, rotation, and pitch. `map.kind` distinguishes `area`, `venue`, and `route`; route lines require genuine source geometry and appear only on hover/selection, otherwise start-first.
- The active publication path is agentic research → deterministic validation → bounded Git snapshot, documented in `docs/content-maintenance.md`. No mandatory human approval queue is required.
- Retain source access controls, terms, rights, security, provenance, and no-invention guarantees. Historical `reviewStatus` labels and database review/publication tables are not active gates.
- The page must keep working without runtime credentials.
- Never label a `curated-seed` record as live.
- Do not scrape or reuse images without a documented permission basis.
- Keep the runtime account-free; database credentials remain server-only and `.env.local` is never committed. The optional visitor route and analytics configuration are separate from the static catalog.

## Key files

| Area | File |
|---|---|
| Discovery state and compact panel styling | `components/local-lore-app.tsx`, `components/discovery/discovery.css` |
| Map runtime, hover portal and preview styling | `components/map/mission-map.tsx`, `components/map/mission-map.css` |
| Media, trust, selected detail | `components/missions/mission-media.tsx`, `mission-status.tsx`, `mission-detail.tsx` |
| Bay Area dates and stored schedules | `lib/availability.ts` |
| Global controls/layout styles | `app/globals.css` |
| Map style/layers | `lib/map-style.ts` |
| GeoJSON zones | `lib/activity-zones.ts` |
| Subject artwork and generated licensed assets | `lib/activity-artwork.ts`, `scripts/generate-map-icons.mjs`, `public/map-icons/` |
| Plain frontend activity descriptions | `lib/mission-copy.ts` |
| Deployment-only browser location | `components/map/location-control.tsx`, `location-control.css` |
| Catalog contract | `lib/types.ts` |
| Source-grouped catalog | `data/source-catalog.json` |
| Catalog UI adapter | `lib/seed-data.ts` |
| Catalog publisher and maintenance | `scripts/agentic-publisher.mjs`, `docs/content-maintenance.md` |
| Historical source refresh/review | `scripts/refresh-sources.ts`, `scripts/events.ts`, `lib/ingestion/` |
| Database repository/schema/migration | `db/repository.ts`, `db/schema.ts`, `drizzle/postgres/0003_parallel_boomer.sql` |
| Analytics bootstrapping | `components/posthog-provider.tsx` |
| Visitor capture | `app/api/visitor/route.ts`, `db/schema.ts`, `drizzle/postgres/0002_add_visitors.sql` |
| Runtime commands | `package.json` |
| Native Next configuration | `next.config.ts` |
| Catalog and ingestion tests | `tests/source-catalog.test.mjs`, `tests/ingestion.test.ts` |
| Shared map bounds and home camera | `lib/region.ts` |
| Source permissions | `docs/source-and-image-policy.md` |

## Deployment and verification

Vercel deploys pushes to `master`. Before a risky release run lint, strict TypeScript, `npm run build:vercel`, and tests. Confirm the PMTiles range request returns `206` and inspect desktop/mobile map behavior. See `docs/deployment.md` and `docs/development-and-testing.md`.

The verification result for the current backend restructuring is:

- `npm run lint` passes.
- `npx tsc --noEmit --incremental false` passes.
- `npm test` passes: production build plus ten catalog/ingestion tests.
- `npm run db:generate` reports no schema changes to migrate.
- `npm run catalog:validate` passes for 165 groups and 212 display-approved records under the maintainer’s assumption.
- Historical catalog import validated 165 groups and 212 records; the importer has since been removed from the active Git-snapshot publication path.
- Browser smoke at `http://localhost:4317` confirms the map is ready and all 212 records are visible. The smoke blocked `/api/visitor` intentionally to avoid writing the operator's IP; no application runtime errors were observed.
- Neon migration/import succeeded locally: four migrations, 165 sources, and 212 catalog rows. No source fetch or human-review command was run during setup; recurring refresh and database-backed UI reads remain inactive.

### Local startup failure discovered 2026-08-06

Cloudflare/Vinext is not part of the current failure. Native Next.js starts with `next dev --webpack --port 4317`, but interrupted background or terminal sessions can orphan Next child processes. Those children may hold port 4317 or leave a `.next/_events_*.json` record with `NEXT_CLI_SESSION_STOPPED` after roughly 20 seconds. The record does not contain an application exception.

If the direct error is `Cannot find module '../shared/lib/size-limit'` (or another file inside `node_modules/next`), the dependency tree is incomplete or was modified while an old worker was still running. Rebuild it from the lockfile after stopping confirmed Local Lore workers:

```bash
rm -rf node_modules .next
npm ci
npm run dev
```

Recovery:

```bash
lsof -nP -iTCP:4317 -sTCP:LISTEN
kill <confirmed-local-lore-next-pid>
rm -rf .next
npm run dev
```

Run `npm run dev` in a foreground terminal and leave that terminal open. Do not launch it in the background and kill only the npm parent; Next can retain child workers. Do not kill the unrelated Codex preview process commonly found on port 3000.

## Intentionally inactive / historical code

`db/`, `drizzle/`, and `pg` support the optional visitor route, repeatable catalog importer, event candidate workflow, and historical review CLI. They are not the active publication boundary. The active catalog path and maintenance procedure are documented in `docs/content-maintenance.md`.

## Handoff maintenance contract

Every future agent should update this file when it changes any of the following:

- package scripts, Node/npm requirements, local port, or build runtime;
- Vercel configuration, production URL, environment variables, or hosting;
- map bounds, gestures, controls, source/layer IDs, PMTiles assumptions, or mobile behavior;
- `LoreItem`, source-grouped catalog state, image metadata, source policy, or ingestion boundary;
- test commands, test coverage, known warnings, or a newly discovered blocker;
- the distinction between active product code and archived prototypes.

The update should state what changed, why it changed, what was validated, and what remains intentionally out of scope. Keep this document factual and current; do not record speculative future work as implemented behavior. If this document conflicts with code, fix both in the same change before handing the repository to another agent.
