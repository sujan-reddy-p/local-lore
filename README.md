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

Open the URL printed by the development server. The retained Codex preview commonly uses [http://127.0.0.1:3100](http://127.0.0.1:3100).

Run the complete local verification set:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
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
- A 1200×630 Open Graph/Twitter share image that echoes the initial dark San Francisco map view and activity zones; it is generated from code at `/opengraph-image` so it works on Vercel without a WebGL screenshot step.
- A Neon/Postgres catalog foundation with source freshness state, structured-event extraction, automated publish/discard logging, and a protected Vercel daily-refresh route. Existing source links start in link-only mode until automated access is explicitly approved.
- Vite/vinext + Cloudflare build support and a separate Next.js/Vercel build path.

## Repository map

```text
app/                          App Router shell, metadata, and global design
components/local-lore-app.tsx Map, discovery controls, browser, hover, details
lib/seed-data.ts              Static 212-mission V1 catalog
lib/types.ts                  Publish-boundary data contract
lib/availability.ts           Availability and seven-day logic
lib/activity-zones.ts         Point and polygon GeoJSON
lib/map-style.ts              OSM style, 3D buildings, clusters, zones
lib/sources/                  Approved source directory and policy records
lib/ingestion/                Fetch, extraction, normalization, AI copy, refresh
lib/agent/                    Server-only agent configuration and cron auth
db/schema.ts                  Postgres sources, missions, runs, observations, decisions
db/repository.ts              Server-side LoreItem repository and seed bootstrap
drizzle/postgres/             Generated Neon/Postgres migrations
public/maps/                  Local PMTiles vector archive
worker/index.ts               vinext Cloudflare Worker entry
build/sites-vite-plugin.ts    Build-time hosting metadata packager
scripts/serve-local.mjs       Range-aware server for built vinext output
tests/                        Rendered-shell and architectural assertions
docs/                         Product and engineering handoff guides
```

## Documentation index

- [Agent handoff](docs/agent-handoff.md) — current state, invariants, known risks, and recommended next work.
- [Product and UX](docs/product-and-ux.md) — product principles, flows, responsive behavior, and accessibility.
- [Architecture](docs/architecture.md) — runtime boundaries, rendering flow, component hierarchy, and dependency choices.
- [Map system](docs/map-system.md) — PMTiles, style layers, 3D, controls, interactions, clustering, and debugging.
- [Catalog and data model](docs/catalog-and-data-model.md) — fields, scheduling behavior, seed conventions, and content QA.
- [Ingestion and AI](docs/ingestion-and-ai.md) — adapters, agent boundaries, validation, review, refresh, and expiry.
- [Storage](docs/storage.md) — current static state, future schema, migrations, and activation plan.
- [Design system](docs/design-system.md) — visual language, tokens, overlays, motion, and mobile rules.
- [Development and testing](docs/development-and-testing.md) — commands, environments, tests, browser QA, and troubleshooting.
- [Deployment](docs/deployment.md) — Vercel and Cloudflare paths, PMTiles byte ranges, and release checklist.
- [Source and image policy](docs/source-and-image-policy.md) — attribution, automation permission, licensing, and prohibited behavior.
- [Mission image workflow](docs/mission-image-workflow.md) — exact naming, primary-versus-alternate rules, and the image manifest for future mission additions.
- [Roadmap and decisions](docs/roadmap-and-decisions.md) — phased future work and decisions already made.
- [Contribution guide](CONTRIBUTING.md) — safe change workflow and review checklist.
- [Changelog](CHANGELOG.md) — concise record of the implemented V1.

Future coding agents should read [AGENTS.md](AGENTS.md) before changing the project.

## Current constraints

- The Next.js/Vercel page reads the Neon catalog server-side and falls back to `lib/seed-data.ts` during an outage. It bootstraps the static seed catalog idempotently when Neon is empty.
- A protected Vercel daily cron checks only due, explicitly permissioned sources. One official SF Recreation & Parks iCalendar feed is enabled; existing organizer links remain link-only until their automation policy is documented.
- The agentic directory has no human review flow by product decision. Deterministic validation publishes or discards candidates; OpenRouter may propose short editorial framing but cannot provide factual fields.
- Labels use the Protomaps glyph CDN. The vector archive is local, but labels still require network access until glyphs are self-hosted.
- The PMTiles asset must be served with HTTP byte-range support. See the deployment guide before changing hosting.
- 117 mission primaries are served locally from `public/images/missions/` through the typed image manifest; alternate candidates use `-2` and `-3` suffixes. Three legacy Wikimedia Commons images remain externally hosted. No images were generated for this project.
- The app is dark-mode-only in the current implementation. Light-mode support remains future work.
- `shadcn/ui` and Supabase are not active dependencies. Neon Postgres is the active server-side catalog store.

## License and source responsibility

The source code has no separate license file yet. OpenStreetMap data attribution is shown in the map control. Mission copy and source links are part of this portfolio prototype. Do not scrape organizer sites, copy event descriptions, or reuse images without documented permission. See [docs/source-and-image-policy.md](docs/source-and-image-policy.md).
