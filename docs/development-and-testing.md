# Development and testing

## Prerequisites

- Node.js 22.13 or newer, matching `package.json` engines.
- npm and a modern WebGL-capable browser.
- Network access for first dependency install and Protomaps label glyphs.

No application environment variables or map tokens are required. `.env*` is ignored.

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install the locked dependency tree. |
| `npm run dev` | Start native Next.js development mode on port 4317. |
| `npm run lint` | ESLint the application, library, scripts, and config surfaces. |
| `npx tsc --noEmit --incremental false` | Strict typecheck without cached incremental state. |
| `npm run build` | Produce the native Next/Vercel build using webpack. |
| `npm run build:vercel` | Alias for the native Vercel build using webpack. |
| `npm test` | Build with Next, then run Node architectural tests. |
| `npm run db:generate` | Generate a Drizzle migration from `db/schema.ts`. |
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

## Automated tests

`tests/rendered-html.test.mjs` runs after a native Next build and checks the application source/build shell and architectural contracts. It asserts:

- correct title and map shell;
- 212-mission count;
- All-time calendar choice;
- interaction guidance;
- absence of starter content;
- enabled pan/rotate/touch/pitch behavior;
- absence of MapLibre NavigationControl;
- whole-city custom control;
- source-check and seed status;
- exact catalog count and source presence;
- zone-coordinate derivation, clustering, glyphs, dates, traits, images, mission browser, and reduced motion.

These tests are architectural regressions, not full WebGL tests.

## Manual desktop browser QA

1. Load the root page and wait for `data-map-health.ready`.
2. Confirm land, water, roads, parks, and neighborhood labels render.
3. Confirm 3D buildings are visible at initial/closer zoom.
4. Confirm no native plus/minus zoom buttons and exactly three custom camera buttons.
5. Drag to pan, wheel/trackpad to zoom, right-drag to rotate/pitch.
6. Use keyboard zoom/navigation after focusing the map.
7. Click rotate, tilt through all states, then restore whole city.
8. Hover multiple zones and confirm title/time/price follows the correct location.
9. Click a cluster and confirm expansion.
10. Click a mission and confirm card, camera focus, source link, seed notice, accessibility, and optional image credit.
11. Toggle Free, Social, Outside, Food ritual, Live music, Sunset, query prompts, and All time. Confirm non-matching halos, glyphs, and clusters vanish—not just list rows—and `data-visible-mission-count` matches the visible result count.
12. Open MissionBrowser, test query prompts, category, traits, time, budget, reset, no-results, Escape, and `/` focus.
13. Inspect console and `data-map-error`.

## Manual mobile QA

Test at approximately 390×844 and 360×800:

- no horizontal page overflow;
- full-height map;
- filter/date rows scroll horizontally;
- curiosity labels remain readable and icons visible;
- camera controls do not cover primary discovery controls;
- one-finger pan and two-finger zoom/rotate/pitch;
- browser behaves as a bottom sheet and result list scrolls independently;
- detail card can be closed and does not trap the map;
- source link is tappable;
- orientation change recalculates map size correctly.

## Reduced-motion QA

Emulate `prefers-reduced-motion: reduce`. Mission pulse should not animate, Framer Motion should avoid entry initialization where configured, and CSS animation/transition durations should effectively collapse. Camera motion remains marked essential for spatial state changes; reconsider that choice if user research indicates discomfort.

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

Check Protomaps glyph CDN requests and CSP/network. Geometry can work while glyphs fail.

### Symbols drift or flatten

Check point/zone derive from one coordinate and symbol alignment remains viewport-based.

### Build passes but map fails in production

Build tools do not validate static-host byte ranges. Test the deployed asset directly as described in `docs/deployment.md`.

### Date count unexpectedly drops

Inspect explicit schedules, Weekend fallback, browser date/time zone, selected calendar key, and whether All time is active.

## Performance notes

- All 212 records are currently in the client bundle; this is acceptable at V1 scale, but a live catalog should move the searchable record set behind an API and map viewport query.
- MapLibre creates a significant client chunk and build tools may warn above 500 KiB. Lazy loading can improve initial shell cost later.
- Filtering reconstructs small GeoJSON collections and calls `setData`; acceptable for hundreds of items, but thousands need server/window querying or indexed client state.
- PMTiles dramatically reduces file count but requires efficient range caching.
