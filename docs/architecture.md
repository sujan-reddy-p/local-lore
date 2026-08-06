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

The initial product brief mentioned shadcn/ui and PostgreSQL/Supabase as options, but neither is active. The current UI is purpose-built CSS because the experience is a map surface, not a collection of standard dashboard components.

## Runtime boundaries

### Server-rendered shell

`app/page.tsx` renders `LocalLoreApp`. `app/layout.tsx` owns metadata and imports MapLibre and global CSS. The component is marked `"use client"`, so server output contains a useful UI shell while all map construction occurs after hydration.

### Client map runtime

`LocalLoreApp` creates one `maplibregl.Map` inside a mount-only effect. Refs retain the map, popup, hovered mission ID, map element, and search input without forcing map reconstruction. The cleanup removes animation, popup, map instance, and the PMTiles protocol.

### Static catalog

`lib/seed-data.ts` is imported into the client bundle. `featuredLore` currently aliases the complete catalog. Filtering produces an in-memory `visible` list, then updates both GeoJSON sources using `setData`. No request is issued when filters change.

### Future ingestion boundary

Source adapters and validation are outside the component. The intended publish boundary is still `LoreItem`, which means a future database/API can replace the static import without changing the map’s conceptual contract.

## Component hierarchy

```text
RootLayout
└── Home
    └── LocalLoreApp
        ├── MapLibre canvas
        ├── map vignette
        ├── compact map brand + discovery intent
        │   ├── quick filters
        │   ├── curiosity filters
        │   └── All-time/seven-day rail
        ├── camera action stack
        ├── gesture/zone key
        ├── MissionBrowser (conditional)
        │   ├── search and prompts
        │   ├── category grid
        │   ├── traits/time/budget
        │   └── LoreVisual result rows
        ├── ActivityCard (conditional)
        │   └── LoreVisual
        └── no-results state (conditional)
```

Keeping these small presentation functions in one file makes shared state direct for V1. Split them only when a second page, server data layer, or independent test surface makes the boundary valuable.

## State model

UI state includes active quick filters, selected category, time, budget, curiosity, traits, seven generated dates, selected date key, free-text query, selected mission, browser visibility, map loaded state, and whether the visitor has moved the map.

Derived state:

- `selectedDate`: `null` for All time or a Date object.
- `visible`: the catalog filtered by every active dimension.
- `filterCount`: active filter dimensions for reset affordance.

Map state such as center, zoom, pitch, bearing, loaded sources, and hovered feature remains inside MapLibre and refs. React does not mirror camera state, avoiding high-frequency rerenders.

## Map-to-React synchronization

1. The map initializes with all mission polygons and points.
2. When `visible` changes, React calls `setData` on both `activity-zones` and `mission-points` using the same ID set. Non-matching halos, glyphs, and clusters therefore disappear together. Synchronization checks the real source objects directly and, during first paint only, retries once on `styledata`; it does not depend on a separate React “map loaded” flag.
3. When `selected` changes, React updates filter expressions on selected layers.
4. Map pointer handlers resolve feature `properties.id` back to the canonical `featuredLore` record.
5. `choose` sets React selection and eases the MapLibre camera.

This ID link is the important invariant. Do not duplicate title/price/source truth into GeoJSON beyond what map styling and hit-testing require.

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

- No authentication or application user database.
- PostHog browser analytics and session replay are enabled when public build configuration is present; see `docs/analytics.md`.
- No location permission is requested; the “whole city” control restores a fixed camera and is not GPS tracking.
- External links use `target="_blank"` and `rel="noreferrer"`.
- No application secrets are required in V1.
- Remote images are rendered unoptimized to avoid routing arbitrary third-party URLs through the application optimizer.
