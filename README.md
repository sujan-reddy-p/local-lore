# Local Lore

Local Lore is a map-first Bay Area discovery experience: **what is a memorable way to spend my time nearby?** The baseline has 225 activities, including the original 212 curated ideas and 13 newly source-backed activities/events in Berkeley, San José, and San Francisco.

The map is the product. There are no accounts, feeds, or calendar dashboards. A visitor can pan, pinch, scroll, rotate, tilt, browse visually, choose a date, select an interest, or open a mission. Every recommendation links to its original organizer or authoritative source.

> Data status: all 212 existing records remain visible and retain their historical `approved_for_display` lineage label. The active publication path is an agentic researcher → deterministic validator → bounded Git snapshot; there is no mandatory human approval/review queue. Source access, rights, security, and provenance remain required, and incomplete findings are skipped rather than invented.

## Start here

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). Local Lore uses native Next.js locally and on Vercel, with port 4317 reserved for the project to avoid common preview-process collisions.

Run the complete local verification set:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
```

## What is implemented

- A full-screen MapLibre map backed by a checked-in 87.6 MiB Bay Area PMTiles archive, covering San Francisco, the Bay, Napa/Sonoma approaches, Santa Cruz, and Monterey.
- OpenStreetMap/Protomaps context, roads, parks, water, neighborhood labels, and extruded 3D buildings.
- Drag, scroll/pinch zoom, right-drag rotation, two-finger tilt/rotate, box zoom, and keyboard navigation.
- A compact, always-visible discovery panel with search, eight interest choices (including Anything), date choices, an arbitrary native date picker, and a filter disclosure for budget and approximate activity time. There is no gallery or duplicate category/trait browser.
- Regional pan bounds and a Bay Area home view; the current mission catalog remains focused on San Francisco.
- Density-aware clusters at city scale; map markers keep a restrained halo when building/landuse footprints are absent or visually tiny. The halo fades as a real, loaded polygon becomes legible; it is a locator, never a fabricated boundary.
- Subject-specific Lucide artwork badges with editable SVG and retina PNG assets in `public/map-icons`; missing/error media uses the same compact activity artwork rather than stock photography.
- Any day, Today, Tomorrow, Weekend, and a native picker for arbitrary dates, using Bay Area calendar days; date matching is explicitly not a confirmed live schedule.
- Camera zoom through 18, overzooming native zoom-14 vector tiles; explicit plus/minus and secondary rotate/tilt/region controls.
- Desktop and responsive mobile mission details with one specific action sentence, three facts, one website CTA, and an inline Info disclosure for source, schedule, accessibility, and photo provenance.
- Hover previews share the mission description and media treatment but never show an Explore action; the selected mission's preview is suppressed.
- Curated/verified/directory status and stored source-check dates, without inventing live freshness or opening hours.
- A deployed-only location control requests browser geolocation on secure non-loopback hosts, bounds-checks the result, and reports denied/unavailable/outside/retry states without storing or sending coordinates.
- A 1200×630 Open Graph/Twitter share image that echoes the initial dark San Francisco map view and activity zones; it is generated from code at `/opengraph-image` in the Node.js runtime so it works on Vercel Hobby without a WebGL screenshot step.
- A source-backed, agentic catalog publisher with local research/processing, deterministic validation, and bounded Git snapshots; research runs locally, not in a GitHub scheduled workflow. Raw proposals and evidence outputs stay ignored; only final processed catalog/state files may enter Git. macOS launchd scheduling is local. The former database review/publication path is historical inactive infrastructure.

## Local catalog discovery

The active workflow uses `scripts/discover-catalog.mjs`, `scripts/daily-discovery.mjs`, and `scripts/schedule-discovery.mjs`. The researcher defaults to `openai-codex/gpt-6-luna` with locally authenticated OMP; override with `--model` or `LOCAL_DISCOVERY_MODEL`. Source access is assessed agentically from published terms and technical controls; no human approval queue is required, but source access permission, image rights, provenance, and no-invention rules remain mandatory.

`npm run catalog:daily` requires installed dependencies, authenticated local OMP, a clean committed checkout, and a local branch matching `origin`. It researches, validates, and builds in an isolated ignored Git worktree, leaving the root `.next` untouched. Only `data/source-catalog.json` and `data/discovery-state.json` are managed for commits; raw proposals/evidence remain ignored local outputs. A failed push leaves the bounded local commit in place; push it deliberately before the next run.

The macOS launchd schedule defaults to 08:17 local time. To install from a durable clone (never this `/tmp` checkout), use:

```bash
git clone https://github.com/sujan-reddy-p/local-lore.git ~/Projects/local-lore
cd ~/Projects/local-lore
npm ci
npm run catalog:schedule -- install
```

The schedule runs the next occurrence, not immediately. Installation state is machine-local; these instructions do not imply that launchd is installed or that a discovery run has been tested.

The baseline catalog contains 225 records. Goals of 350–500 distinct useful regional experiences and a 75 km Bay Area cutoff guide research; they are coverage targets, not achieved totals or a license to include unsupported findings. Route geometry appears only when genuine source-backed ordered geometry exists, and then only on hover/selection; otherwise route activities remain start-first. Grouped dated events use a chooser.

## Repository map

```text
app/                          App Router shell, metadata, and global design
app/api/visitor/              Server-only Neon visitor capture route
components/local-lore-app.tsx Discovery panel/filter/selection state and camera actions
components/map/              MapLibre runtime, hover portal, controls, and preview CSS
components/discovery/        Compact discovery panel and filter styles
components/missions/         Shared media, evidence-based status, selected details
data/source-catalog.json Source-grouped catalog; existing records accepted for display by maintainer instruction
lib/seed-data.ts              Adapter from source groups to the `LoreItem` UI contract
lib/types.ts                  Publish-boundary data contract
lib/availability.ts           Bay Area calendar/date-selection and stored schedule rules
lib/activity-zones.ts         Point and polygon GeoJSON
lib/region.ts                 Shared map bounds, home camera, and ingestion geography
lib/ingestion/                 HTTPS fetch, ICS/JSON-LD parsing, timezone normalization, candidate staging
db/ and drizzle/               PostgreSQL schema and migrations for catalog, ingestion, and review
scripts/                       Catalog validation/import and explicit refresh/review CLIs
tests/                         Catalog invariants and ingestion parser/normalization edge cases
docs/                         Product and engineering handoff guides
```

## Documentation index

- [Agent handoff](docs/agent-handoff.md) — current state, invariants, known risks, and recommended next work.
- [Product and UX](docs/product-and-ux.md) — product principles, flows, responsive behavior, and accessibility.
- [Architecture](docs/architecture.md) — runtime boundaries, rendering flow, component hierarchy, and dependency choices.
- [Map system](docs/map-system.md) — PMTiles, style layers, 3D, controls, interactions, clustering, and debugging.
- [Catalog and data model](docs/catalog-and-data-model.md) — fields, scheduling behavior, seed conventions, and content QA.
- [Content maintenance](docs/content-maintenance.md) — one authoritative guide to research, add/update/remove/retire, source and city coverage, validation, publish, and revert.
- [Ingestion and AI](docs/ingestion-and-ai.md) — source evidence, normalization, provenance, and inactive legacy database notes.
- [Local catalog agent playbook](docs/local-agent-playbook.md) — agent research conventions and source checks.
- [Local agent automation runbook](docs/local-agent-automation.md) — runtime boundaries and publisher coordination.
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

- The deployed page bundles `data/source-catalog.json` through `lib/seed-data.ts`; it does not read the operational event database. The server-only visitor route uses Neon only when configured.
- Existing records and source statuses preserve historical lineage; they do not require a human approval action before an eligible, evidence-backed Git snapshot can publish. The old database review/publication commands and review queue are inactive.
- The publisher must assess access permissions and retain source terms, rights, security, provenance, and source checks. It must not invent facts, and it must skip incomplete findings. Human correction/takedown workflows are not implemented now.
- Basemap labels use the Protomaps glyph CDN. The vector archive and subject activity artwork are local, but labels still require network access until glyphs are self-hosted.
- The PMTiles asset must be served with HTTP byte-range support. See the deployment guide before changing hosting.
- Mission image metadata lives on each record in `data/source-catalog.json`; local assets are served from `public/images/missions/`. There is no separate image manifest.
- The app is dark-mode-only in the current implementation. Light-mode support remains future work.
- Neon/Postgres remains server-side operational/history infrastructure; catalog and event reads remain static.
