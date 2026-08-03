# Agent handoff

## Current production truth

Local Lore is a deployed, single-page Next.js map experience for San Francisco. The public site is intentionally static at runtime: it reads `lib/seed-data.ts`, renders a local PMTiles map, and does not fetch sources, write a database, or call AI.

Catalog freshness is a separate local-agent workflow. The local agent checks approved sources, updates typed Git-tracked records, validates the app, and pushes a commit. GitHub/Vercel then deploy the catalog update.

## First reading order

1. `README.md`
2. `AGENTS.md`
3. this file
4. `docs/local-agent-playbook.md` for catalog work
5. `docs/source-and-image-policy.md` before changing sources, facts, or images
6. the focused map, UX, analytics, or deployment guide

## What works

- Full-viewport MapLibre map with local `public/maps/san-francisco.pmtiles`.
- San Francisco bounds, 3D buildings, pan, zoom, rotate, tilt, whole-city reset, clusters, zones, hover previews, and source links.
- 212 curated-seed missions, map-driven filtering, All time default, mobile map-first layout, reduced-motion support, and source disclosure.
- Category-specific zone colors: Outside blue, Move coral, Make blue, Listen gold, Eat orange-red, Learn purple, Community green, After dark pink.
- Compact Claude/Lore-agent identity and an explanatory map control.
- PostHog browser provider: automatic capture and session replay activate only when `NEXT_PUBLIC_POSTHOG_KEY` is configured at build time.

## Architecture invariants

- Missions are geographic zones, never generic pins.
- Keep glyphs centered through pan, zoom, rotation, and pitch.
- Do not widen `SF_BOUNDS` without a deliberate product decision.
- The page must keep working without runtime credentials.
- Never label a `curated-seed` record as live.
- Do not scrape or reuse images without a documented permission basis.
- Preserve keyboard, touch, contrast, focus, and reduced-motion behavior.

## Key files

| Area | File |
|---|---|
| Map and UI state | `components/local-lore-app.tsx` |
| Visual system | `app/globals.css` |
| Map style/layers | `lib/map-style.ts` |
| GeoJSON zones | `lib/activity-zones.ts` |
| Catalog contract | `lib/types.ts` |
| Published catalog | `lib/seed-data.ts` |
| Image manifest | `lib/mission-images.ts` |
| Analytics bootstrapping | `components/posthog-provider.tsx` |
| Source directory | `lib/sources/source-directory.ts` |

## Deployment and verification

Vercel deploys pushes to `master`. Before a risky release run lint, strict TypeScript, `npm run build:vercel`, and tests. Confirm the PMTiles range request returns `206` and inspect desktop/mobile map behavior. See `docs/deployment.md` and `docs/development-and-testing.md`.

## Intentionally inactive / historical code

`db/`, `drizzle/`, `lib/ingestion/`, `lib/agent/`, and `scripts/migrate-postgres.mjs` are retained historical prototypes. They are not imported by the deployed page and must not be reactivated casually. The current catalog publication path is documented in `docs/local-agent-playbook.md`.
