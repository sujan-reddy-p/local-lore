# Map system

## Overview

The map combines four systems:

1. A local PMTiles vector archive derived from OpenStreetMap/Protomaps data.
2. A Protomaps dark basemap flavor customized for Local Lore.
3. Activity scene geometry: `activity-zones` for accepted area/venue context and `activity-routes` only for genuine sourced route lines.
4. Clustered `mission-points` with subject artwork, hit areas, and the restrained fallback locator; there is no dedicated activity-locators source.

## Archive and protocol

`public/maps/san-francisco-region.pmtiles` is an 87.6 MiB regional archive bounded to [-123.1, 36.55, -121.4, 38.5] at native zoom levels 0–14. Keep OpenStreetMap and Protomaps attribution visible. Runtime uses same-origin PMTiles range reads.

PMTiles performs HTTP range requests. The server must return correct `Accept-Ranges`, `Content-Length`, and `Content-Range` behavior. A successful HTML response does not prove the map asset works.

## Camera and bounds

Defined in `lib/map-style.ts`:

```ts
BAY_AREA_BOUNDS = [[-123.1, 36.55], [-121.4, 38.5]]
BAY_AREA_HOME = {
  center: [-122.42, 37.78],
  zoom: 8.3,
  pitch: 26,
  bearing: -8,
}
```

These shared values live in `lib/region.ts` and define the map pan limits, home camera, and ingestion coordinate validation. The bounded area includes San Francisco, nearby Bay cities, Napa/Sonoma approaches, Santa Cruz, and Monterey; the catalog remains city-heavy. The camera supports zoom 7.8–18, maximum pitch 72, no world copies, and `maxBounds: BAY_AREA_BOUNDS`. The vector source explicitly caps native tile zoom at 14; MapLibre overzooms those tiles through camera zoom 18. This enlarges existing geometry without inventing higher-resolution data. Do not widen the bounds without matching archive coverage.

## Basemap

`createMapStyle` uses `namedFlavor("dark")`, then overrides earth, water, parks, roads, buildings, and label colors. POIs are intentionally disabled to prevent the basemap competing with missions. Road shields and one-way layers are removed.

The Protomaps `buildings` layer is replaced by `sf-buildings-3d`, a fill extrusion using source height/min-height where available. Extrusion begins flat at zoom 10 and interpolates to full source height at zoom 12. Color brightens by height, vertical gradient is enabled, and opacity is 0.88.

Label glyphs currently come from:

```text
https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf
```

Self-host those files if a fully offline or CSP-restricted experience is required.
At close zoom, `MissionMap` may learn legitimate matching native buildings/landuse outlines. Source Polygon/MultiPolygon with holes, a string `map.evidence`, and `sourceUrl` is preferred. Native outlines are valid secondary context only when they legitimately match. Every mission retains a 25–100 m ground locator circle fallback; it is a locator, never a physical footprint.

`map.kind` supplies context: area/venue may have supported geometry; routes are always start-first. Never render an area polygon as a course. A line appears only on focus for exact source-backed course geometry or a typed `connection` with exactly two geocoded actual endpoints; connections are dashed and directed.

## Layer order and zoom behavior

After basemap layers, Local Lore adds:

- `zone-fill` and `zone-edge`: supported source/native area or venue outlines; every mission keeps a ground locator circle fallback.
- `zone-hover` and `zone-hover-edge`: filtered hover emphasis from zoom 12.2.
- `zone-selected` and `zone-selected-edge`: filtered selected emphasis from zoom 12.2.
- `mission-clusters` and `mission-cluster-count`: density aggregation through cluster max zoom 13, with same-venue events grouped and a chooser retaining every event.
- `mission-symbol`: subject-specific artwork badge.
- `mission-hover` and `mission-selected`: viewport-aligned center rings.
- `mission-hit`: nearly transparent pointer target.

Far clusters stay restrained; middle zoom uses badges and restrained halos; close zoom uses outlines where honest. Selected treatments are stronger than ambient treatments, with no ambient pulses. Cluster radius is 34 pixels. Clicking a cluster asks the GeoJSON source for its expansion zoom, capped at `map.getMaxZoom()` (18). Selecting a mission moves to at least zoom 15.5 without zooming out an already closer view.


## Why icons remain centered

Center, hover, and selected treatments use viewport alignment so the artwork badge stays upright and undistorted during pitch and rotation. The mission symbol uses a centered, viewport-aligned icon; the geographic anchor remains the mission point. Prefer style-layer symbols over HTML markers so clustering, hover, and filtering stay synchronized.

## Icon generation

Subject artwork is generated offline from editable SVG definitions and exported retina PNGs in `public/map-icons`. MapLibre loads the generated native `sprite.json`/`sprite.png` or `sprite@2x.json`/`sprite@2x.png` before resolving marker symbols; do not reintroduce asynchronous per-marker `loadImage` registration. Individual PNGs remain available for cards/share images. Lucide ISC/MIT paths are composed into consistent rounded-square badges. Regenerate all badge and sprite assets with:

```bash
npx tsx scripts/generate-map-icons.mjs
```

The artwork kind is selected from venue/title subject words with a category fallback. It is not a Unicode category glyph and does not claim availability.

## Interactions

MapLibre configuration explicitly enables drag pan, drag rotate, pitch with rotate, touch zoom/rotate, touch pitch, scroll zoom, box zoom, and keyboard. Cooperative gestures are disabled so normal map behavior works without modifier-key prompts.

`components/map/mission-map.tsx` owns one canvas hit-resolution pass: `mission-hit`, then `mission-clusters`, then zone layers. It resolves IDs against the supplied catalog and applies the hover filters and React popup. Pointer leave uses a 160 ms grace period so the preview can be entered without flicker. Pointer entry or keyboard focus retains the card; focused previews are not replaced by background map hover. Camera movement, filter changes, and Escape close the popup and clear hover. Selection remains independent and uses `__none__` when inactive.

## Custom controls

The compact discovery panel is opened by a hamburger, hidden by default on desktop and mobile. Closed controls remain mounted but inert and preserve filters. Opening focuses search; Escape closes and restores focus to the trigger. The opened panel keeps interests/dates compact and has budget/time sliders only. Map tools remain separate and responsive.

Interactive hover previews float above discovery controls. They share the mission's specific description and media treatment, have no Explore action, and are dismissed on leaving, Escape, a filter change, or camera movement. A selected mission suppresses its preview.

## Health instrumentation

Every ~1.2 seconds during rendering, the map element receives a JSON `data-map-health` attribute containing style/source readiness, rendered building/cluster/zone/neighborhood-label counts, and camera values. Map errors are written to `data-map-error` and logged.

This instrumentation exists for actual browser smoke runs. Readiness and counts depend on zoom and viewport; a clustered regional overview can legitimately have no rendered individual zones. Unclustered places have visible ground-aligned locator halos from zoom 9.5, including when no footprint is known. Do not use an invisible tiny polygon as a substitute for a legible locator.

Native outline learning runs only for unresolved visible places in a settled camera/filter state; accepted geometry persists. Source-induced idle events do not repeat full polygon matching and JSON signatures. The versioned PMTiles URL uses immutable caching and byte ranges: bump the archive URL version whenever replacing the archive, and verify HTTP 206/Content-Range rather than transferring the whole 87.6 MiB asset.


## Blank-map debugging order

1. Confirm the map container has non-zero dimensions and `height: 100dvh`.
2. Read `data-map-error` and browser console errors.
3. Inspect the PMTiles request and its range response headers/status.
4. Confirm `data-map-health.styleLoaded` and `sourceLoaded`.
5. Confirm the archive URL is same-origin and not rewritten to HTML.
6. Confirm WebGL is available.
7. Confirm no second map is being created during hot reload.
8. Confirm remote label-glyph failures affect labels only, not vector geometry or local activity artwork.
9. Reset to `BAY_AREA_HOME` in case the camera is at a sparse edge.

## Map change checklist

- Test initial, top-down, maximum-pitch, rotated, cluster, and close neighborhood views.
- Verify source/native outlines appear only when supported and matching, holes remain open, clipped/oversized candidates are rejected, and every mission retains its 25–100 m locator circle without implying a physical footprint.
- Verify all 20 subject badges register from the native sprite before markers render, no missing-image warnings occur on a fresh load, and artwork remains crisp at retina scale.
- Verify hover/select layer filters, continuous area-aware fades, popup cleanup, and selected-preview suppression.
- Verify desktop drag/right-drag/wheel and mobile pan/pinch/tilt.
- Verify Anything, each interest, dates, arbitrary date picker, budget, approximate activity-time filter, and Reset all update both map sources; travel is not included in time.
- Verify source, schedule, accessibility, and photo provenance are behind Info; the website is the sole CTA.
- Verify deployed location control gating, bounds, denied/unavailable/outside/retry statuses, and stale callback/moved-camera guards without persisting coordinates.
- Check reduced motion.
- Run the native Next production build; `npm test` includes that build and the behavioral suite.
