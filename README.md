# Local Lore

Local Lore is a map-first Bay Area discovery experience: **what is a memorable way to spend my time nearby?** Discovery uses manually invoked, source-supported research. Further expansion is paused for design-quality review; current coverage and unfinished leads are recorded in `data/discovery-state.json`.

The map is the product. There are no accounts, feeds, or calendar dashboards. A visitor can pan, pinch, scroll, rotate, tilt, browse visually, choose a date, select an interest, or open a mission. Every recommendation links to its original organizer or authoritative source.
> Data status: the existing catalog is maintained manually through an explicitly invoked OMP GPT-6 Luna skill. Existing `approved_for_display` labels are historical lineage; source access, rights, security, and provenance remain required.


## Start here

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). Local Lore uses native Next.js locally and on Vercel, with port 4317 reserved for the project to avoid common preview-process collisions.

Run the complete local verification set:

```bash
npm run catalog:validate
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
```

## What is implemented

- A full-screen MapLibre map backed by a checked-in 87.6 MiB Bay Area PMTiles archive, covering San Francisco, the Bay, Napa/Sonoma approaches, Santa Cruz, and Monterey.
- OpenStreetMap/Protomaps context, roads, parks, water, neighborhood labels, and extruded 3D buildings.
- Drag, scroll/pinch zoom, right-drag rotation, two-finger tilt/rotate, box zoom, and keyboard navigation.
- A hamburger opens the compact discovery panel, hidden by default on desktop and mobile. While closed it remains mounted but inert and preserves filters; opening focuses search, Escape closes it, and focus returns to the trigger.
- Density-aware clusters at city scale; map markers keep a restrained halo when building/landuse footprints are absent or visually tiny. The halo fades as a real, loaded polygon becomes legible; it is a locator, never a fabricated boundary.
- Subject-specific Lucide artwork badges with editable SVG and retina PNG assets in `public/map-icons`; native 1×/2× sprites prevent startup image-registration races. Missing/error media uses the same compact activity artwork rather than stock photography.
- Any day, Today, Tomorrow, Weekend, and a native picker for arbitrary dates, using Bay Area calendar days; date matching is explicitly not a confirmed live schedule.
- Camera zoom through 18, overzooming native zoom-14 vector tiles; explicit plus/minus and secondary rotate/tilt/region controls.
- Desktop and responsive mobile mission details with one specific action sentence, three facts, one website CTA, and an inline Info disclosure for source, schedule, accessibility, and photo provenance.
- Hover previews share the mission description and media treatment but never show an Explore action; the selected mission's preview is suppressed.
- Curated/verified/directory status and stored source-check dates, without inventing live freshness or opening hours.
- A deployed-only location control requests browser geolocation on secure non-loopback hosts, bounds-checks the result, and reports denied/unavailable/outside/retry states without storing or sending coordinates.
- A 1200×630 Open Graph/Twitter share image using the Bay Area map-and-badge visual language; it is generated from code at `/opengraph-image` in the Node.js runtime so it works on Vercel Hobby without a WebGL screenshot step.
- The catalog is static and maintained through an explicitly invoked OMP skill. There is no JavaScript research/publishing workflow, automatic schedule, or automatic Git operation. Historical database review/publication infrastructure is inactive.

## Local catalog discovery

Manual maintenance runs only when explicitly invoked. **Further expansion is paused pending the user's design-quality review.** The reusable “discover X” experience matrix, city/coast/countryside coverage, complete-candidate gate, worker supervision, source/geometry rules, and private missing-image staging procedure are in [.claude/skills/local-discovery/SKILL.md](.claude/skills/local-discovery/SKILL.md).

From the repository root, invoke OMP with the skill file included:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md and perform a bounded manual catalog maintenance run."
```

There is no installed cron, timer, LaunchAgent, scheduled frequency, JavaScript research runner, automatic commit, or automatic push. The user decides when to trigger maintenance and whether to commit or push. The offline catalog validator remains available as `npm run catalog:validate`.

Maintain the full inventory with bounded local OMP GPT-6 Luna worker loops; record checked, failed, and unchanged outcomes. Manual, ephemeral agent processing code under ignored `outputs/` may normalize large JSON batches, but is not an installed pipeline or package command. Use explicit batches of five named venues, literal names and coordinates, and distinct output filenames to prevent reader elision; parent integrates, deduplicates against the full catalog, and normalizes typed records. A failed read does not close a source, and unvisited sources are not failed reads.

The 100-evergreen-per-major-city goal never overrides quality or breadth. City quotas alone missed Pacifica, Half Moon Bay, the coast and South San Francisco; these are explicit regional gaps. Map-only POIs, generic park-walk inflation, and candidates missing usable websites remain leads, not finished missions. Current counts, blockers, and held leads are in `data/discovery-state.json`; use actual city boundaries in `data/coverage-boundaries.geojson` rather than historical snapshots.

Venue identity/address can locate a mission through actual geographic data even when the primary site omits coordinates; coordinates need not be copied into prose. Never substitute sibling venue coordinates or city centers. Named POIs are leads, not proof of actual visitor access or live operation. Prefer a supported source Polygon/MultiPolygon, preserving holes and recording string evidence plus source URL; otherwise a legitimate matching native outline may be used. Every mission retains a 25–100 m ground locator circle as fallback, never a physical footprint. Routes are start-first; do not render areas as courses. Optional typed routes require exact source-supported course geometry or a `connection` with exactly two geocoded actual endpoints; connections are dashed/directed and lines appear only on focus. Images prefer authorized event photo, venue photo, then logo, with explicit reuse/credit evidence; absent/failed photos use UI-owned subject artwork, not stock or newly generated catalog photos.

One-off scheduled occurrences expire from their actual dates/end timestamps; date-only end dates are inclusive Bay Area calendar days, timestamps expire at their instant. Evergreen and ongoing recurring listings have no TTL.

Every discovery/refresh worker must research missing imagery. Images with unclear reuse permission are downloaded into ignored `outputs/image-review/`, outside `public/`, with source/credit/hash metadata in discovery state's `pendingImages`; they are not put on the website or committed as public binaries until user review. A fresh checkout reproduces these machine-local downloads from the manifest. Existing authorized imagery or owned artwork stays visible meanwhile.


The historical catalog baseline is not a current count. Report counts only from current JSON and actual city boundaries.

## Repository map

```text
app/                          App Router shell, metadata, and global design
app/api/visitor/              Server-only Neon visitor capture route
components/local-lore-app.tsx Discovery panel/filter/selection state and camera actions
components/map/              MapLibre runtime, hover portal, controls, and preview CSS
components/discovery/        Compact discovery panel and filter styles
components/missions/         Shared media, evidence-based status, selected details
data/source-catalog.json Source-grouped catalog; historical approval labels are lineage
lib/seed-data.ts              Adapter from source groups to the `LoreItem` UI contract
lib/types.ts                  Publish-boundary data contract
lib/availability.ts           Bay Area calendar/date-selection and stored schedule rules
lib/activity-zones.ts         Shared anchors, contextual outlines, and sourced routes
lib/region.ts                 Shared map bounds, home camera, and ingestion geography
data/ and scripts/            Static source catalog, offline validator, legacy ingestion
docs/                         Product and engineering handoff guides
```

## Documentation index

- [Agent handoff](docs/agent-handoff.md) — current state, invariants, known risks, and recommended next work.
- [Product and UX](docs/product-and-ux.md) — product principles, flows, responsive behavior, and accessibility.
- [Architecture](docs/architecture.md) — runtime boundaries, rendering flow, component hierarchy, and dependency choices.
- [Map system](docs/map-system.md) — PMTiles, style layers, 3D, controls, interactions, clustering, and debugging.
- [Catalog and data model](docs/catalog-and-data-model.md) — fields, scheduling behavior, seed conventions, and content QA.
- [Content maintenance](docs/content-maintenance.md) — authoritative manual research, update/retire, evidence, and validation procedure.
- [Ingestion and AI](docs/ingestion-and-ai.md) — source evidence, normalization, provenance, and inactive legacy database notes.
- [Local catalog agent playbook](docs/local-agent-playbook.md) — manual source research and catalog conventions.
- [Manual catalog maintenance](docs/local-agent-automation.md) — manual research and source outcomes.
- [Analytics](docs/analytics.md) — PostHog setup, current collection, dashboard usage, and future event rules.
- [Visitor capture](docs/visitor-capture.md) — Neon storage, fields, queries, and retention guidance.
- [Storage](docs/storage.md) — current static state, future schema, migrations, and activation plan.
- [Design system](docs/design-system.md) — visual language, tokens, overlays, motion, and mobile rules.
- [Development and testing](docs/development-and-testing.md) — commands, environments, tests, browser QA, and troubleshooting.
- [Deployment](docs/deployment.md) — Vercel, PMTiles byte ranges, and release checklist.
- [Mission image workflow](docs/mission-image-workflow.md) — image metadata, asset naming, permission review, and local path validation.
- [Roadmap and decisions](docs/roadmap-and-decisions.md) — phased future work and decisions already made.
- [Contribution guide](CONTRIBUTING.md) — safe change workflow and review checklist.
- [Changelog](CHANGELOG.md) — concise record of the implemented V1.

Future coding agents should read [AGENTS.md](AGENTS.md) before changing the project.

## Current constraints

- `lib/seed-data.ts` reads `data/source-catalog.json` on the server and explicitly projects website fields. Raw research evidence stays out of browser props and JavaScript. The page does not read the operational event database; the server-only visitor route uses Neon only when configured.
- Existing record/source statuses preserve historical lineage. The user explicitly controls when to invoke manual OMP maintenance and whether to commit or push. Database review/publication commands are inactive.
- Basemap labels use the Protomaps glyph CDN. The vector archive and subject activity artwork are local, but labels still require network access until glyphs are self-hosted.
- The PMTiles asset must be served with HTTP byte-range support. See the deployment guide before changing hosting.
- Mission image metadata lives on each record in `data/source-catalog.json`; local assets are served from `public/images/missions/`. There is no separate image manifest.
- The app is dark-mode-only in the current implementation. Light-mode support remains future work.
- Neon/Postgres remains server-side operational/history infrastructure; catalog and event reads remain static.
