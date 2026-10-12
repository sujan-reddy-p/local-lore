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
| Local vector transport | PMTiles 4.4 protocol and checked-in archive |
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

`data/source-catalog.json` is the grouped, versioned source catalog. `lib/seed-data.ts` adapts it into the existing `LoreItem` client contract. `featuredLore` currently aliases the complete catalog. Filtering produces an in-memory `visible` list, then updates both GeoJSON sources using `setData`; no catalog request is issued when filters change. A separate client effect makes one request per browser session to the server-only `app/api/visitor/route.ts` route, which writes visitor records to Neon through Drizzle.

### Future ingestion boundary

Source adapters and validation are outside the component. The intended publish boundary is still `LoreItem`, which means a future database/API can replace the static import without changing the map’s conceptual contract.

## Component hierarchy

```text
RootLayout
└── Home
    ├── MissionMap — MapLibre canvas, source sync, hover portal
    │   └── MissionMedia (preview)
    ├── map vignette
    ├── compact discovery panel — search, interests, dates, filters
    ├── map tools — zoom, location (deployed hosts), and secondary view options
    ├── MissionDetail — selected mission, facts, website CTA, Info disclosure
    │   └── MissionMedia (detail) + MissionStatus (source/schedule)
    └── no-results state
```

The split follows behavior, not component size. Map lifecycle, image failures, and evidence-based status have independent ownership; discovery state and its controls remain together. Scoped discovery/map/media/status CSS is imported by `app/globals.css`. No new runtime, UI framework, backend dependency, or alternate catalog contract is introduced.

`MissionMedia` owns a keyed image body per URL. Preview media uses a compact frame; selected detail uses the larger responsive frame. Loading, missing, and failed photos use subject-specific activity artwork from `public/map-icons`, never a stock photo or duplicate text. Detail renders the venue title, mission-specific sentence from `lib/mission-copy.ts` (falling back to the catalog description), three facts, and one website CTA. Source/schedule/accessibility/photo provenance belongs behind the native inline Info disclosure. All catalog copy is rendered through React, including the popup via `createPortal` into MapLibre's `setDOMContent` container; no catalog HTML interpolation is used.

## State model

UI state includes search, the eight interest choices, budget, approximate activity duration, a reference date, selected date key, selected mission, and map-view visibility. Dates are Bay Area calendar days, not browser-local dates. Travel is intentionally excluded from the approximate activity-time filter.

Derived state:

- `selectedDates`: `[]` for Any day; one day for ISO selection; the upcoming weekend day(s) for Weekend. Match a mission if any selected day meets stored schedule rules.
- `visible`: the catalog filtered by every active dimension.
- `activeChips`: removable refinement constraints; date, interest, and query retain their own visible controls.

Map state such as center, zoom, pitch, bearing, loaded sources, and hovered feature remains inside MapLibre and refs. React does not mirror camera state, avoiding high-frequency rerenders.

## Map-to-React synchronization

1. The map initializes with mission points, activity routes when genuine source geometry exists, and any currently learned outlines.
2. When `visible` changes, `MissionMap` calls `setData` on `activity-zones` and `mission-points` using the same ID set. The fallback locator shares the clustered `mission-points` source; there is no separate activity-locators source. Synchronize whenever those source objects exist; only wait for initial `load` when they are absent.
3. At native zoom 14 and closer, the map queries loaded `buildings` and `landuse` features. `matchActivityOutlines` applies relevance, containment, hole-aware geometry, area limits, and native-tile-boundary rejection. A WeakMap cache retains learned shapes across zooms; unknown areas remain visible honest locators.
4. Same coordinates or same venue within 30 m are grouped. Cluster properties use weighted `activity_count` and a near-venue count; opening a compact chooser shows title/date only, not duplicate full cards or images.
5. One canvas hit pass prioritizes center targets, then clusters, then zones. IDs resolve against the supplied catalog. Hover filters and a 160 ms leave grace keep the preview usable; pointer entry and keyboard focus retain it. Camera movement, filter changes, and Escape dismiss transient hover. Area opacity transitions are continuous rather than threshold flashes.
6. `choose` sets React selection and eases to at least zoom 15.5, preserving a closer zoom. At 980 px and below, selection closes transient discovery content; the visible panel stays available. Camera animations honor reduced motion.

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
