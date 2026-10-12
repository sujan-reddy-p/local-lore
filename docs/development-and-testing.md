# Development and testing

## Prerequisites

- Node.js 22.13 or newer, matching `package.json` engines.
- npm and a modern WebGL-capable browser.
- Network access for first dependency install and Protomaps label glyphs.

No application environment variables or map tokens are required to run the local preview. Historical database commands use the ignored `.env.local`; do not commit it or expose its values. The active catalog publisher requires locally authenticated OMP.

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install the locked dependency tree. |
| `npm run dev` | Start native Next.js development mode on port 4317. |
| `npm run lint` | ESLint the application, library, scripts, and config surfaces. |
| `npx tsc --noEmit --incremental false` | Strict typecheck without cached incremental state. |
| `npm run build` | Produce the native Next/Vercel build using webpack. |
| `npm run build:vercel` | Alias for the native Vercel build using webpack. |
| `npm test` | Build with Next, then run catalog and ingestion behavior tests. |
| `npm run catalog:validate` | Validate source groups, record IDs/order, display/source lineage states, coordinates, and local image paths. |
| `npm run catalog:research -- --output outputs/proposal.json` | Run the local agentic researcher; requires authenticated OMP. Defaults to `openai-codex/gpt-6-luna`. |
| `npm run catalog:stage -- --proposal outputs/proposal.json` | Deterministically validate and preview a proposal without applying it. |
| `npm run catalog:apply -- --proposal outputs/proposal.json` | Apply a validated proposal to the local catalog and discovery state. |
| `npm run catalog:daily` | Run isolated local research, validation, build/tests, then bounded catalog/state commit and push; requires clean, synchronized checkout and local OMP credentials. |
| `npm run catalog:schedule -- install|remove|status` | Manage the macOS launchd schedule; local schedule is in `data/discovery-config.json` under `schedule.hour` and `schedule.minute`. |
| `npm run db:generate` | Generate a Drizzle migration from historical `db/schema.ts`. |
| `npm run db:migrate` | Apply historical PostgreSQL migrations using `DATABASE_URL_UNPOOLED` first, then `DATABASE_URL` or `POSTGRES_URL`. |
| `npm run db:setup` | Apply PostgreSQL migrations for optional visitor storage; requires configured Neon credentials. Catalog publication does not use Postgres. |
| `npm run start` | Serve the native Next production build on port 4317. |

## Local development behavior

The development server is intentionally pinned to port `4317` by the `dev` script. This avoids the commonly occupied port 3000 and makes the local URL predictable: `http://127.0.0.1:4317`. MapLibre is bundled by Next.js and retains ownership of its worker bundle.

If a direct workspace process becomes stuck because of build locks or watcher state, stop the old process, remove only confirmed generated `.next` output, and restart. Do not delete source or reset the repository.

If `npm run dev` prints the command but never prints `Ready`, inspect port 4317 for an orphaned Local Lore Next process. An interrupted background run can leave child workers alive even after the npm parent exits. Stop only the confirmed process for this repository, remove `.next`, and restart in a foreground terminal:

```bash
lsof -nP -iTCP:4317 -sTCP:LISTEN
kill <confirmed-local-lore-next-pid>
rm -rf .next
npm run dev
```

The Node process on port 3000 used by a Codex preview is unrelated and should not be stopped as part of this recovery.

If Next reports a missing internal module such as `../shared/lib/size-limit`, the local dependency installation is incomplete. Stop confirmed Local Lore workers, then restore dependencies from the lockfile:

```bash
rm -rf node_modules .next
npm ci
npm run dev
```


## Manual desktop browser QA

1. Load the root page and wait for `data-map-health.ready`.
2. Confirm land, water, roads, parks, and neighborhood labels render.
3. Confirm 3D buildings are visible at initial/closer zoom.
4. Confirm the compact panel exposes search, Anything plus the seven subject interests, dates, and Filters without a hamburger or gallery.
5. Drag to pan, wheel/trackpad to zoom, right-drag to rotate/pitch.
6. Use keyboard zoom/navigation after focusing the map.
7. Open Map view options, rotate/tilt through all states, then restore Whole region. Zoom beyond 14 to 18 and confirm buildings/tiles remain rendered with no archive errors.
8. At close zoom, verify valid loaded building/landuse outlines preserve holes; oversized or tile-boundary-clipped candidates remain point artwork rather than becoming circles. Unknown areas are not presented as verified boundaries.
9. Hover a mission and verify the preview uses the specific mission sentence, compact media, no Explore action, and disappears when that mission is selected.
10. Click a cluster and confirm expansion.
11. Click a mission and confirm the detail has truthful media or subject artwork fallback, venue title, three facts, one website CTA, and Info disclosure for source/schedule/accessibility/photo provenance.
12. Toggle each interest, dates, arbitrary picker date, budget, approximate activity-time filter, and Any day. Confirm both map sources update; Reset all must return to Any day, empty query, and the complete catalog. Verify travel is excluded from activity time.
13. Inspect `data-map-health`, console, and `data-map-error`. On a deployed secure host, exercise location permission, retry, denial, unavailable, outside-bounds, and moved-camera behavior; confirm local/loopback hides the control and no coordinates persist.

## Manual mobile QA

Test at approximately 390×844 and 360×800:

- visible search and horizontally scrolling interest/date rows;
- interest labels and Lucide icons remain readable;
- camera controls do not cover primary discovery controls;
- one-finger pan and two-finger zoom/rotate/pitch;
- detail card fills the available height below the compact panel, closes cleanly, and does not trap the map;
- detail media uses the larger responsive frame; missing/error photo uses compact subject artwork without duplicate text;
- Info disclosure and website link are tappable;
- orientation change recalculates map size correctly.

## Reduced-motion QA

Emulate `prefers-reduced-motion: reduce`. Map centers are static, CSS transitions collapse, and non-essential MapLibre camera actions avoid easing. Block an existing image request: preview/detail must show subject artwork without a broken image. Select a mission with a different image URL to verify failed-image state does not leak. Enter the preview, focus its website action, and move the pointer away; the focused preview remains usable until action, Escape, filter change, or camera movement. Verify selected mission preview suppression.

## Map health inspection

In browser devtools:

```js
JSON.parse(document.querySelector('.map-canvas').dataset.mapHealth)
```

Expected keys: ready, styleLoaded, sourceLoaded, buildings, clusters, zones, neighborhoodLabels, zoom, pitch, bearing, center. Counts vary by camera and zoom. Inspect `.dataset.mapError` for the most recent MapLibre error.

## Common failures

### Blank map with visible UI

Usually PMTiles range serving, WebGL, zero-size container, or archive URL rewrite. Follow `docs/map-system.md`.

### Map works but labels are absent

Check Protomaps label glyph CDN requests and CSP/network. Geometry and local activity artwork can work while labels fail.

### Activity outline is absent

At least one matching polygon must be loaded from native z14 `buildings` or `landuse` data. Oversized, hole-invalid, or native-tile-boundary-clipped candidates intentionally fall back to the point artwork; this is not a radius failure.

### Location control is absent

It is hidden on localhost, loopback, and `*.localhost`, and requires a deployed secure context. On eligible hosts, inspect permission, browser geolocation availability, Bay Area bounds, and whether the camera moved before the callback.

### Build passes but map fails in production

Build tools do not validate static-host byte ranges. Test the deployed asset directly as described in `docs/deployment.md`.

### Date count unexpectedly drops

Inspect explicit schedules, editorial Weekend fallback, Bay Area calendar day, selected date key, and whether Any day is active. A filter match is not live confirmation; missing schedules remain explicitly unconfirmed in details.

## Performance notes
- The current catalog snapshot contains 212 records in the client bundle; that is observed V1 scale, not a fixed contract for later discovery snapshots. A live/database-backed catalog would need an API and map viewport query.
- MapLibre creates a significant client chunk and build tools may warn above 500 KiB. Lazy loading can improve initial shell cost later.
- Filtering reconstructs small GeoJSON collections and calls `setData`; acceptable for hundreds of items, but thousands need server/window querying or indexed client state.
- PMTiles dramatically reduces file count but requires efficient range caching.
