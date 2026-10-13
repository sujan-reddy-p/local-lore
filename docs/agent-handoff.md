# Agent handoff

> This is the living context document for Local Lore. Update it in the same
> change whenever the runtime, deployment path, catalog contract, map behavior,
> test commands, known limitations, or ownership boundaries change.

**Last updated:** 2026-10-12
**Current branch:** `master`
**Repository:** `https://github.com/sujan-reddy-p/local-lore`
**Production:** `https://local-lore-five.vercel.app`

## Manual catalog maintenance — 2026-10-12

- Catalog upkeep is an explicitly invoked OMP GPT-6 Luna skill; the user controls when and whether to publish through Git. No JavaScript researcher/publisher, cron, timer, LaunchAgent, automatic commit/push, or human approval gate is active. Ephemeral agent code under ignored `outputs/` may normalize large JSON; it is not an installed pipeline or package command.
- The offline validator remains available and requires a visitor website separately from API evidence. Manual source outcomes are recorded in `data/discovery-state.json`. Failed reads preserve good records and are not closures; unvisited sources are not failed reads. Further discovery is paused, not complete.
- Current publication is deliberately smaller than the raw research inventory: incomplete map-only leads and generic park-walk inflation are held in `data/discovery-state.json`, not passed off as finished missions. Coverage remains incomplete. Expansion is paused pending the user's design-quality review; local GPT-6 Luna research also hit `usage_limit_reached`. Use current state's actual coverage rather than historical counts. City minimums never override complete candidates, broad human experiences, real websites, locations, and image research.
- Explicit five-venue leaf microbatches use literal venue names, coordinates, and distinct output filenames. Parent deduplicates against the full catalog and normalizes typed records. Venue identity/address may be matched to actual geographic data; coordinates need not be printed, and sibling/city-center coordinates are never substitutes. Named POIs are leads, not confirmation of visitor access or live operation.
- Source Polygon/MultiPolygon geometry with holes, string `map.evidence`, and `sourceUrl` is preferred, then a legitimate matching native outline; every mission retains a 25–100 m ground locator circle fallback, never a physical footprint. Routes are start-first; only exact source course geometry or typed connection with exactly two geocoded actual endpoints can render on focus. Connections are dashed/directed, never claim an area is a course.
- Scheduled occurrences use canonical `schedule.kind: scheduled`, `startsAt`/`endsAt`; date-only ends are inclusive Bay Area calendar days and timestamps expire at their instant. Evergreen/ongoing recurrence has no TTL. Missing-image research is mandatory on discovery and refresh. Unclear-rights candidates are downloaded into ignored `outputs/image-review/` and manifested in `pendingImages`, but not published or publicly committed until user review.
- Start a new city by reading `.claude/skills/local-discovery/SKILL.md`: its experience matrix, geography, complete-candidate gate, five-venue worker assignments, image staging, integration, and reporting are the operational contract. Do not substitute a POI dump or a generic-walking quota.
- Performance boundary: the raw catalog stays server-side; `lib/seed-data.ts` whitelists display fields, and client/map code must not import it. Search indexes are memoized; native outlines are learned only for unresolved visible places at settled camera/filter states. PMTiles remains range-fetched, not downloaded in full for each visitor.
- Current baseline: 785 display records and 860 held leads; the preliminary Oakland quota no longer passes the stricter visitor-website gate. There are 621 published records awaiting image research and no newly staged unclear-rights images claimed. Resume from current state, not historical output counts; the requested Luna model must become available and the user must clear the expansion pause.

## Historical snapshot baseline — 2026-10-12

- Historical source research and publication facts below describe prior workflows only. They do not describe current manual runs, counts, schedule, or publication.

## Historical production context — last verified 2026-10-11

The deployed page reads the static `data/source-catalog.json` via `lib/seed-data.ts`. Catalog upkeep is manual OMP research and direct supported edits; the active workflow does not use PostgreSQL.

Local development and Vercel production now use the same native Next.js runtime. The local development server is pinned to port `4317`:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:4317`. Do not reintroduce Vinext, Wrangler, a Cloudflare Worker, or a second local asset server unless the hosting decision changes and this document is updated first.

Existing `approved_for_display` labels and database migration/import details are historical lineage/infrastructure, not evidence of current accuracy, automated-fetch permission, or image reuse permission. The deployed page uses the static catalog and does not read database event data.

## First reading order

1. `README.md`
2. `AGENTS.md`
3. this file
4. `docs/local-agent-playbook.md` for catalog work
5. `docs/source-and-image-policy.md` before changing sources, facts, or images
6. the focused map, UX, analytics, or deployment guide

## What works

- Full-viewport MapLibre map with local regional PMTiles archive (87.6 MiB), 3D buildings from native zoom 10–12, and camera zoom through 18 over native zoom-14 tiles.
- Hamburger opens the compact discovery panel, hidden by default desktop/mobile; closed panel remains mounted but inert and preserves filters. Open focuses search; Escape closes; focus returns to trigger. Interests/dates and budget/time sliders only; no duplicate category controls.
- Every mission has a 25–100 m ground locator-circle fallback. Source polygons require geometry, holes, string evidence, and URL; legitimate matching native outline is second choice. This locator is not a venue footprint. Routes start-first and only typed exact course geometry or actual two-endpoint connections show on focus; connections are dashed/directed.
- Images use source-authorized event/venue/logo priority; missing/failed photos show UI-owned subject artwork, not stock photos.
- Deployed secure hosts request browser geolocation and offer retry; localhost/loopback hide the control and never request location. Denial/outside coverage preserve the camera, and late/stale callbacks cannot replace user navigation. No GPS is stored or transmitted.

Prior browser/map/location verification details were removed for concision; they were historical results and do not verify this change.

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

- Keep a visible 25–100 m ground locator circle for every mission unless an authentic geometry is visible; never describe it as a physical boundary.
- `map.kind` distinguishes area, venue, and route; routes are start-first, and lines render on focus only with actual course geometry or exactly two geocoded actual endpoints for typed connections.
- Catalog maintenance is a manually invoked OMP skill; the user controls invocation and Git publication. See `docs/content-maintenance.md`. No automatic publisher or schedule exists.
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
| Catalog maintenance | `data/source-catalog.json`, `.claude/skills/local-discovery/SKILL.md`, `docs/content-maintenance.md` |
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

The checks below are historical backend/repository results from an earlier catalog snapshot. They are not current record counts and do not verify the manual OMP cutover above. The manual cutover's catalog validator could not be invoked through the available tools.

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

`db/`, `drizzle/`, and `pg` support optional visitor capture and historical ingestion/review infrastructure. They are not the active catalog maintenance boundary. Catalog maintenance is manual OMP plus offline validation, as documented in `docs/content-maintenance.md`.

## Handoff maintenance contract

Every future agent should update this file when it changes any of the following:

- package scripts, Node/npm requirements, local port, or build runtime;
- Vercel configuration, production URL, environment variables, or hosting;
- map bounds, gestures, controls, source/layer IDs, PMTiles assumptions, or mobile behavior;
- `LoreItem`, source-grouped catalog state, image metadata, source policy, or ingestion boundary;
- test commands, test coverage, known warnings, or a newly discovered blocker;
- the distinction between active product code and archived prototypes.

The update should state what changed, why it changed, what was validated, and what remains intentionally out of scope. Keep this document factual and current; do not record speculative future work as implemented behavior. If this document conflicts with code, fix both in the same change before handing the repository to another agent.
