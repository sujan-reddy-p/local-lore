# Development and testing

## Prerequisites

- Node.js 22.13 or newer, matching `package.json` engines.
- npm and a modern WebGL-capable browser.
- Network access for first dependency install and Protomaps label glyphs.

No application environment variables or map tokens are required to run the local preview. Catalog research is a manually invoked OMP skill as documented in `docs/content-maintenance.md`; no research scheduler or automatic Git publisher exists.

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
| `npm run catalog:validate` | Offline validation of source groups, record IDs/order, display/source lineage states, coordinates, and local image paths. |
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
4. Confirm the hamburger opens discovery; it is hidden by default on desktop/mobile. While closed, the panel stays mounted but inert and preserves filters. Opening focuses search; Escape closes and restores focus to trigger. The opened panel has interests/dates and budget/time refinement only.
5. Drag to pan, wheel/trackpad to zoom, right-drag to rotate/pitch.
6. Use keyboard zoom/navigation after focusing the map.
7. Open Map view options, rotate/tilt through all states, then restore Whole region. Zoom beyond 14 to 18 and confirm buildings/tiles remain rendered with no archive errors.
8. At close zoom, verify supported source/native outlines preserve holes; oversized or tile-boundary-clipped candidates fall back honestly while the 25–100 m ground locator circle remains available. Never present it as a physical footprint.
9. Hover a mission and verify the preview uses the specific mission sentence, compact media, no Explore action, and disappears when that mission is selected.
10. Click a cluster and confirm expansion.
11. Click a mission and confirm the detail has truthful media or subject artwork fallback, venue title, three facts, one website CTA, and Info disclosure for source/schedule/accessibility/photo provenance.
12. Toggle each interest, dates, arbitrary picker date, budget, approximate activity-time filter, and Any day. Confirm both map sources update; Reset all must return to Any day, empty query, and the complete catalog. Verify travel is excluded from activity time.
13. Inspect `data-map-health`, console, and `data-map-error`. On a deployed secure host, exercise location permission, retry, denial, unavailable, outside-bounds, and moved-camera behavior; confirm local/loopback hides the control and no coordinates persist.

## Manual mobile QA

Test at approximately 390×844 and 360×800:

- hamburger-hidden panel opens on activation; closed controls are inert, filters persist, search receives focus, Escape closes and restores trigger focus;
- interests and dates are legible in compact opened panel; sliders refine budget/time only;
- camera controls do not cover primary discovery controls;
- one-finger pan and two-finger zoom/rotate/pitch;
- detail card fills the available height below the compact panel, closes cleanly, and does not trap the map;
- detail media uses the larger responsive frame; missing/error photo uses UI-owned subject artwork without duplicate text;
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

Matching native z14 `buildings` or `landuse` geometry is optional secondary context. Oversized or tile-boundary-clipped candidates are rejected; every mission retains its 25–100 m ground locator circle, which is not a physical boundary.

### Location control is absent

It is hidden on localhost, loopback, and `*.localhost`, and requires a deployed secure context. On eligible hosts, inspect permission, browser geolocation availability, Bay Area bounds, and whether the camera moved before the callback.

### Build passes but map fails in production

Build tools do not validate static-host byte ranges. Test the deployed asset directly as described in `docs/deployment.md`.

### Date count unexpectedly drops

Inspect explicit schedules, editorial Weekend fallback, Bay Area calendar day, selected date key, and whether Any day is active. A filter match is not live confirmation; missing schedules remain explicitly unconfirmed in details.

- Expansion is paused for design review; current coverage and incomplete research are recorded in `data/discovery-state.json`. Recompute counts from JSON and actual city boundaries before reporting. Coverage goal is 100 distinct evergreen experiences per major city, without padding.
- MapLibre remains a substantial client dependency. Inspect actual production transfers; do not equate catalog file size with downloaded JavaScript. The browser receives projected mission fields, not raw research evidence.
- Search normalization is memoized. Native outline discovery runs only for unresolved visible missions at changed, settled camera states; verify filtering and map interaction in the actual browser.
- PMTiles dramatically reduces file count but requires efficient range caching.
