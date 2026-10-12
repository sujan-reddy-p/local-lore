# Map system

## Overview

The map combines four systems:

1. A local PMTiles vector archive derived from OpenStreetMap/Protomaps data.
2. A Protomaps dark basemap flavor customized for Local Lore.
3. Activity scene geometry: `activity-zones` for accepted area/venue context and `activity-routes` only for genuine sourced route lines.
4. Clustered `mission-points` with subject artwork, hit areas, and the restrained fallback locator; there is no dedicated activity-locators source.

## Archive and protocol

`public/maps/san-francisco-region.pmtiles` is a 91,892,255-byte regional archive extracted from the Protomaps 2026-10-11 daily build (basemap v4.15.2), bounded to [-123.1, 36.55, -121.4, 38.5] at zoom levels 0–14. Protomaps distributes its OpenStreetMap-derived basemap as an ODbL Produced Work; keep OpenStreetMap and Protomaps attribution visible. At runtime the client requests `/maps/san-francisco-region.pmtiles?v=20261011-bay-area` using PMTiles range reads.

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
At close zoom, `MissionMap` queries the loaded native z14 `buildings` and `landuse` source layers. `matchActivityOutlines` keeps only a relevant polygon containing an area or venue mission point, rejects oversized geometry and polygons clipped at a native tile boundary, and preserves polygon holes. If no honest match is available, every activity remains visibly represented by a restrained soft-circle locator (a locator only, never a claimed boundary). Park/building polygons are not assigned to running, cycling, or route activities.

`map.kind` supplies context: `area` may use a genuine containing area outline, `venue` may use a matching venue/building context, and `route` starts at its sourced coordinate. A route line is shown only when genuine source geometry exists, and only on hover or selection; otherwise it remains start-first. The point and any outline remain linked by mission ID.

## Layer order and zoom behavior

After basemap layers, Local Lore adds:

- `zone-fill` and `zone-edge`: area/venue-aware matched outlines from zoom 11; unmatched items retain visible soft-circle locators.
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

Subject artwork is generated offline from editable SVG definitions and exported retina PNGs in `public/map-icons`. The map loads `/map-icons/{kind}.png` at pixel ratio 2; Lucide ISC/MIT paths are composed into consistent rounded-square badges. Regenerate assets with:

```bash
npx tsx scripts/generate-map-icons.mjs
```

The artwork kind is selected from venue/title subject words with a category fallback. It is not a Unicode category glyph and does not claim availability.

## Interactions

MapLibre configuration explicitly enables drag pan, drag rotate, pitch with rotate, touch zoom/rotate, touch pitch, scroll zoom, box zoom, and keyboard. Cooperative gestures are disabled so normal map behavior works without modifier-key prompts.

`components/map/mission-map.tsx` owns one canvas hit-resolution pass: `mission-hit`, then `mission-clusters`, then zone layers. It resolves IDs against the supplied catalog and applies the hover filters and React popup. Pointer leave uses a 160 ms grace period so the preview can be entered without flicker. Pointer entry or keyboard focus retains the card; focused previews are not replaced by background map hover. Camera movement, filter changes, and Escape close the popup and clear hover. Selection remains independent and uses `__none__` when inactive.

## Custom controls

The app intentionally does not add `NavigationControl`. A visible compact control stack contains zoom in, zoom out, map-view options, and (on eligible deployed hosts) the location control. Secondary options rotate by +35°, cycle approximately 46° → 70° → 0° pitch, or restore `BAY_AREA_HOME`. Discovery is separate and always visible.

Map tools move beside the desktop discovery panel; on mobile they hide while browser/detail content is open to avoid covering actions. Direct map gestures and keyboard remain available. All camera easing honors reduced motion.

Interactive hover previews float above discovery controls. They share the mission's specific description and media treatment, have no Explore action, and are dismissed on leaving, Escape, a filter change, or camera movement. A selected mission suppresses its preview.

## Health instrumentation

Every ~1.2 seconds during rendering, the map element receives a JSON `data-map-health` attribute containing style/source readiness, rendered building/cluster/zone/neighborhood-label counts, and camera values. Map errors are written to `data-map-error` and logged.

This instrumentation exists for local/browser smoke tests. A ready map usually has `styleLoaded: true`, `sourceLoaded: true`, and appropriate feature counts for its zoom and viewport. `zones: 0` is honest when no matching polygon has been learned yet; the mission point and artwork remain the fallback.

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
- Verify matching building/landuse outlines appear only when valid, holes remain open, clipped/oversized candidates fall back to point artwork, and no circle footprint is implied.
- Verify subject artwork loads from `public/map-icons` and remains crisp at retina scale.
- Verify hover/select layer filters, continuous area-aware fades, popup cleanup, and selected-preview suppression.
- Verify desktop drag/right-drag/wheel and mobile pan/pinch/tilt.
- Verify Anything, each interest, dates, arbitrary date picker, budget, approximate activity-time filter, and Reset all update both map sources; travel is not included in time.
- Verify source, schedule, accessibility, and photo provenance are behind Info; the website is the sole CTA.
- Verify deployed location control gating, bounds, denied/unavailable/outside/retry statuses, and stale callback/moved-camera guards without persisting coordinates.
- Check reduced motion.
- Rebuild both production targets.
