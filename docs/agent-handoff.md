# Agent handoff

> This is the living context document for Local Lore. Update it in the same
> change whenever the runtime, deployment path, catalog contract, map behavior,
> test commands, known limitations, or ownership boundaries change.

**Last updated:** 2026-08-06
**Current branch:** `master`
**Repository:** `https://github.com/sujan-reddy-p/local-lore`
**Production:** `https://local-lore-five.vercel.app`

## Current production truth

Local Lore is a deployed, single-page Next.js map experience for San Francisco. The public site is intentionally static at runtime: it reads `lib/seed-data.ts`, renders a local PMTiles map, and does not fetch sources, write a database, or call AI.

Local development and Vercel production now use the same native Next.js runtime. The local development server is pinned to port `4317`:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:4317`. Do not reintroduce Vinext, Wrangler, a Cloudflare Worker, or a second local asset server unless the hosting decision changes and this document is updated first.

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

- Missions are geographic zones, never generic pins.
- Keep glyphs centered through pan, zoom, rotation, and pitch.
- Do not widen `SF_BOUNDS` without a deliberate product decision.
- The page must keep working without runtime credentials.
- Never label a `curated-seed` record as live.
- Do not scrape or reuse images without a documented permission basis.
- Preserve keyboard, touch, contrast, focus, and reduced-motion behavior.
- Keep the runtime account-free and credential-free; `.env.local` is optional for analytics only.

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
| Runtime commands | `package.json` |
| Native Next configuration | `next.config.ts` |
| Architectural regression tests | `tests/rendered-html.test.mjs` |

## Deployment and verification

Vercel deploys pushes to `master`. Before a risky release run lint, strict TypeScript, `npm run build:vercel`, and tests. Confirm the PMTiles range request returns `206` and inspect desktop/mobile map behavior. See `docs/deployment.md` and `docs/development-and-testing.md`.

The current verification result after the runtime cleanup is:

- Local Next server reaches `Ready` in roughly one second on port 4317 after a clean `npm ci`.
- TypeScript passes.
- Production build passes.
- All four architectural tests pass.
- ESLint passes with two non-blocking existing warnings: one missing `catalog` hook dependency and one unused database repository variable.
- The Open Graph image may log a non-blocking Google Fonts fetch warning when the machine has no network access; it falls back and the build still completes.

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

`db/`, `drizzle/`, `lib/ingestion/`, `lib/agent/`, and `scripts/migrate-postgres.mjs` are retained historical prototypes. They are not imported by the deployed page and must not be reactivated casually. The current catalog publication path is documented in `docs/local-agent-playbook.md`.

## Handoff maintenance contract

Every future agent should update this file when it changes any of the following:

- package scripts, Node/npm requirements, local port, or build runtime;
- Vercel configuration, production URL, environment variables, or hosting;
- map bounds, gestures, controls, source/layer IDs, PMTiles assumptions, or mobile behavior;
- `LoreItem`, catalog status, image manifest, source policy, or ingestion boundary;
- test commands, test coverage, known warnings, or a newly discovered blocker;
- the distinction between active product code and archived prototypes.

The update should state what changed, why it changed, what was validated, and what remains intentionally out of scope. Keep this document factual and current; do not record speculative future work as implemented behavior. If this document conflicts with code, fix both in the same change before handing the repository to another agent.
