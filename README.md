# Local Lore

Local Lore is a map-first San Francisco discovery experience. It answers one question: **what is a memorable way to spend my time in the city?** The current V1 presents 212 curated seed “missions” across outdoor routes, movement, making, live music, food rituals, culture, community, pets, scenic drives, and after-dark plans.

The map is the product. There are no accounts, feeds, or calendar dashboards. A visitor can pan, pinch, scroll, rotate, tilt, browse visually, choose a date, select an editorial prompt, or open the mission browser. Every recommendation links to its original organizer or authoritative source.

> Data status: every visible record is clearly marked `curated-seed`. These are believable portfolio records assembled from public organizer and agency pages, not a live event feed. Dates, prices, and availability must be confirmed at the linked source.

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

- A local MapLibre map backed by a checked-in 29.5 MiB San Francisco PMTiles archive.
- OpenStreetMap/Protomaps context, roads, parks, water, neighborhood labels, and extruded 3D buildings.
- Drag, scroll/pinch zoom, right-drag rotation, two-finger tilt/rotate, box zoom, and keyboard navigation.
- Three compact controls: rotate, cycle tilt/top-down, and restore the whole-city home view. There are no `+`/`−` buttons.
- Density-aware clusters at city scale and geographic activity-zone halos at neighborhood scale.
- Viewport-locked category glyphs centered over geographic zones, plus reduced-motion-aware pulse animation.
- A seven-day date rail plus **All time**, which exposes the complete catalog without date filtering.
- Large icon-led curiosity prompts such as Food ritual, Live music, Sunset, After dark, Odd & local, and Scenic drive.
- Search and structured discovery by category, time, budget, traits, vibe, and quick filters.
- Desktop and responsive mobile details with source attribution, accessibility, cost, schedule reminder, and optional licensed photography.
- A 1200×630 Open Graph/Twitter share image that echoes the initial dark San Francisco map view and activity zones; it is generated from code at `/opengraph-image` in the Node.js runtime so it works on Vercel Hobby without a WebGL screenshot step.
- A static, Git-tracked catalog that deploys with the map. A separate local catalog agent maintains sources and missions, then publishes through normal GitHub commits.
- One native Next.js runtime for local development and Vercel deployment.

## Repository map

```text
app/                          App Router shell, metadata, and global design
app/api/visitor/              Server-only Neon visitor capture route
components/local-lore-app.tsx Map, discovery controls, browser, hover, details
lib/seed-data.ts              Static 212-mission V1 catalog
lib/types.ts                  Publish-boundary data contract
lib/availability.ts           Availability and seven-day logic
lib/activity-zones.ts         Point and polygon GeoJSON
lib/map-style.ts              OSM style, 3D buildings, clusters, zones
lib/sources/                  Known source directory for the local catalog agent
lib/ingestion/                Archived prototype utilities; not a web runtime path
db/ and drizzle/              Archived ingestion prototype; not used by the site
public/maps/                  Local PMTiles vector archive
tests/                        Build-shell and architectural assertions
docs/                         Product and engineering handoff guides
```

## Documentation index

- [Agent handoff](docs/agent-handoff.md) — current state, invariants, known risks, and recommended next work.
- [Product and UX](docs/product-and-ux.md) — product principles, flows, responsive behavior, and accessibility.
- [Architecture](docs/architecture.md) — runtime boundaries, rendering flow, component hierarchy, and dependency choices.
- [Map system](docs/map-system.md) — PMTiles, style layers, 3D, controls, interactions, clustering, and debugging.
- [Catalog and data model](docs/catalog-and-data-model.md) — fields, scheduling behavior, seed conventions, and content QA.
- [Ingestion and AI](docs/ingestion-and-ai.md) — adapters, agent boundaries, validation, review, refresh, and expiry.
- [Local catalog agent playbook](docs/local-agent-playbook.md) — daily source checks, catalog updates, validation, and GitHub publishing.
- [Local agent automation runbook](docs/local-agent-automation.md) — daily scheduler contract, source gates, validation, Git publishing, and PostHog boundary.
- [Local-first development workflow](docs/local-development-workflow.md) — iterate locally, review, checkpoint, and make one deliberate GitHub/Vercel release.
- [Analytics](docs/analytics.md) — PostHog setup, current collection, dashboard usage, and future event rules.
- [Visitor capture](docs/visitor-capture.md) — Neon storage, fields, queries, and retention guidance.
- [Storage](docs/storage.md) — current static state, future schema, migrations, and activation plan.
- [Design system](docs/design-system.md) — visual language, tokens, overlays, motion, and mobile rules.
- [Development and testing](docs/development-and-testing.md) — commands, environments, tests, browser QA, and troubleshooting.
- [Deployment](docs/deployment.md) — Vercel, PMTiles byte ranges, and release checklist.
- [Mission image workflow](docs/mission-image-workflow.md) — exact naming, primary-versus-alternate rules, and the image manifest for future mission additions.
- [Roadmap and decisions](docs/roadmap-and-decisions.md) — phased future work and decisions already made.
- [Contribution guide](CONTRIBUTING.md) — safe change workflow and review checklist.
- [Changelog](CHANGELOG.md) — concise record of the implemented V1.

Future coding agents should read [AGENTS.md](AGENTS.md) before changing the project.

## Current constraints

- The deployed page reads the static catalog from `lib/seed-data.ts`; the server-only visitor route writes capture records to Neon when database environment variables are configured.
- A separate local catalog agent checks only documented sources, edits the Git-tracked catalog, and publishes through GitHub commits. See `docs/local-agent-playbook.md`.
- Labels use the Protomaps glyph CDN. The vector archive is local, but labels still require network access until glyphs are self-hosted.
- The PMTiles asset must be served with HTTP byte-range support. See the deployment guide before changing hosting.
- 117 mission primaries are served locally from `public/images/missions/` through the typed image manifest; alternate candidates use `-2` and `-3` suffixes. Three legacy Wikimedia Commons images remain externally hosted. No images were generated for this project.
- The app is dark-mode-only in the current implementation. Light-mode support remains future work.
- `shadcn/ui`, Supabase, and OpenRouter are not runtime dependencies of the deployed product. Neon is used only by the server-side visitor capture route.
