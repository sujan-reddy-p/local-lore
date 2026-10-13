# Technical architecture

## Stack
| Concern | Implementation |
|---|---|
| Application | Next.js 16 App Router, React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4 import plus project-specific CSS in `app/globals.css` |
| Motion | Framer Motion |
| Icons | Lucide React direct ESM icon imports |
| Map | MapLibre GL JS 5.24 |
| Basemap | Protomaps dark flavor over OpenStreetMap-derived vector data |
| Local vector transport | PMTiles 4.4 protocol and checked-in 87.6 MiB archive |
| Analytics | PostHog browser provider with automatic capture and session replay |
| Development and deployment | Native Next.js with webpack, locally and on Vercel |
| Quality | ESLint, strict TypeScript, native Next build, Node architectural assertions |

The initial brief mentioned shadcn/ui and PostgreSQL/Supabase as options. The UI remains purpose-built CSS. Neon/Postgres is used server-side by visitor capture and has an existing Drizzle schema/import path; the catalog is still bundled statically and no live source ingestion is active.

## Runtime boundaries

### Server-rendered shell

`app/page.tsx` renders `LocalLoreApp`. `app/layout.tsx` owns metadata and imports MapLibre and global CSS. The component is marked `"use client"`, so server output contains a useful UI shell while all map construction occurs after hydration.

### Client map runtime

`components/map/mission-map.tsx` creates one `maplibregl.Map` per catalog identity. It owns hit resolution, popup lifetime, source/layer synchronization, and health reporting. The parent retains a map ref for camera actions; it does not mirror camera values in React state. Cleanup removes the leave timer, keyboard handler, popup, map instance, and PMTiles protocol.

### Static catalog and visitor capture

`data/source-catalog.json` is the server-side versioned source catalog. `lib/seed-data.ts` explicitly projects the `LoreItem` display contract; heavy source evidence, coordinate provenance, and research state are never serialized into client props. Client/map modules do not import the raw catalog or a fallback alias. Search text is indexed once per catalog, and query tokens once per query. Filtering updates GeoJSON sources without a catalog request. Native outline lookup processes unresolved visible places once per settled camera/filter state, retaining accepted geometry instead of repeatedly rebuilding it on source-induced idle events. Visitor capture remains a separate server-only route.

### Manual catalog maintenance

`data/source-catalog.json` is versioned and adapted by `lib/seed-data.ts` into the `LoreItem` contract. Research and edits use only an explicitly invoked OMP skill; the user controls invocation and Git publication. Ephemeral processing code under ignored `outputs/` may normalize large JSON but is not an installed pipeline or package command. No JavaScript researcher/publisher, schedule, automation, or human approval gate is active. Historical database ingestion/review remains inactive for catalog publication.

## Component hierarchy

```text
RootLayout
└── Home
    ├── MissionMap — MapLibre canvas, source sync, hover portal
    │   └── MissionMedia (preview)
    ├── map vignette
    ├── hamburger-trigger — compact discovery panel, hidden by default
    │   └── inert while closed; preserves search/interests/dates/refinements
    ├── map tools
    ├── MissionDetail — selected mission, facts, website CTA, Info disclosure
    │   └── MissionMedia + MissionStatus
    └── no-results state

Opening discovery focuses search. Escape closes it and focus returns to the trigger. The open panel keeps interests and dates compact; its refinement view contains only budget and approximate activity-time sliders.

`MissionMedia` owns a keyed image body per URL and image kind. Loading, missing, and failed photos use UI-owned subject artwork, never stock imagery or generated catalog photos. Event image precedes suitable venue image, then logo, only with explicit rights evidence. Detail source/schedule/accessibility/photo provenance stays behind inline Info.


## State model

UI state includes discovery-open state, search, the eight interest choices, budget, approximate activity duration, reference date, selected date key, selected mission, and map-view visibility. Closed discovery remains mounted but inert and preserves filters. Dates are Bay Area calendar days, not browser-local dates. Travel is excluded from approximate activity time.

Derived state:

- `selectedDates`: `[]` for Any day; one day for ISO selection; the upcoming weekend day(s) for Weekend. Match a mission if any selected day meets stored schedule rules.
- `visible`: the catalog filtered by every active dimension.
- `activeChips`: removable refinement constraints; search, interest, and date are controlled in the opened panel.

Map state such as center, zoom, pitch, bearing, loaded sources, and hovered feature remains inside MapLibre and refs. React does not mirror camera state, avoiding high-frequency rerenders.

## Map-to-React synchronization

1. The map initializes with mission points, honest 25–100 m ground locator circles, authentic sourced polygons where supported, typed activity routes where supported, and learned native outlines.
2. When `visible` changes, `MissionMap` calls `setData` on activity-zones and mission-points using the same ID set. The fallback circle belongs to mission-points; there is no separate locator source.
3. At native zoom 14 and closer, matching native outlines may be learned. Source Polygon/MultiPolygon with holes, string map evidence, and source URL is preferred; legitimate matching native outline is next. The circle remains an honest locator, never a fabricated physical footprint.
4. A route starts at its sourced point. Lines appear only on focus, and only for exact sourced course geometry or typed `connection` with exactly two geocoded actual endpoints; connections are dashed/directed, not courses.
5. One canvas hit pass prioritizes center targets, then clusters, then zones. IDs resolve against the supplied catalog. Hover filters and a 160 ms leave grace keep the preview usable; pointer entry and keyboard focus retain it. Camera movement, filter changes, and Escape dismiss transient hover. Area opacity transitions are continuous rather than threshold flashes.
6. `choose` sets React selection and eases to at least zoom 15.5, preserving a closer zoom. At 980 px and below, selection closes transient discovery content; discovery remains reopenable from its hamburger. Camera animations honor reduced motion.

This ID link is the important invariant. Per-record source status and `checkedAt` remain the evidence fields; do not substitute `source.kind` for status. Do not duplicate title/price/source truth into GeoJSON beyond what map styling and hit-testing require.

Filter updates also remove the current hover popup, clear the hover layer, record `data-visible-mission-count` on the map element for QA, and close selection if the selected ID is absent from the new result set.

## Build architecture

The repository has one supported runtime. `npm run dev` starts `next dev --webpack --port 4317`; `npm run build` and `npm run build:vercel` both run `next build --webpack`; `npm run start` serves that production build on port 4317. Vercel runs the same native Next.js compilation through `vercel.json`.

The earlier Cloudflare/Vinext worker path was removed because it duplicated the Vercel deployment runtime and could stall during local startup. There is no worker build, Cloudflare binding, or alternate asset server in the supported architecture.

## Dependency rationale

- **MapLibre:** token-free open map renderer with WebGL, 3D extrusion, gestures, GeoJSON sources, and style expressions.
- **PMTiles:** one deployable, range-addressed vector archive instead of a directory containing thousands of tiles.
- **Protomaps basemaps:** produces a coherent MapLibre style from the archive schema and supplies label layers.
- **Framer Motion:** used only for browser and detail overlays; map animation stays in MapLibre.
- **Direct Lucide imports:** keeps icon usage explicit and avoids broad runtime imports.
- **Drizzle:** keeps the future D1/SQLite schema typed and migration-friendly without activating a database prematurely.

## Security and privacy posture

- No authentication or application user database. The visitor route stores raw IP records in Neon and is not a public read API.
- PostHog browser analytics and session replay are enabled when public build configuration is present; see `docs/analytics.md`.
- Location is opt-in only on deployed secure non-loopback hosts; the control is hidden locally, requests browser permission there, and never stores or sends coordinates.
- External links use `target="_blank"` and `rel="noreferrer"`.
- Remote images are rendered unoptimized to avoid routing arbitrary third-party URLs through the application optimizer.
