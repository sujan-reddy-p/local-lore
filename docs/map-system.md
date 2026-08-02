# Map system

## Overview

The map combines four systems:

1. A local PMTiles vector archive derived from OpenStreetMap/Protomaps data.
2. A Protomaps dark basemap flavor customized for Local Lore.
3. GeoJSON activity polygons derived from mission coordinates and radii.
4. Clustered GeoJSON mission centers with category glyphs and interaction hit areas.

## Archive and protocol

`public/maps/san-francisco.pmtiles` is 30,915,385 bytes. At runtime the client builds an absolute URL for `/maps/san-francisco.pmtiles?v=20260722-padded-2`, registers the PMTiles protocol, and gives MapLibre `pmtiles://<absolute-url>`.

PMTiles performs HTTP range requests. The server must return correct `Accept-Ranges`, `Content-Length`, and `Content-Range` behavior. A successful HTML response does not prove the map asset works.

## Camera and bounds

Defined in `lib/map-style.ts`:

```ts
SF_BOUNDS = [[-122.61, 37.61], [-122.26, 37.93]]
SF_HOME = {
  center: [-122.425, 37.78],
  zoom: 11.8,
  pitch: 44,
  bearing: -12,
}
```

The map additionally uses minimum zoom 10.25, maximum zoom 17.4, maximum pitch 72, no world copies, and `maxBounds: SF_BOUNDS`. The padding includes nearby water, bridges, and Bay context without letting the visitor drift into an empty global map.

## Basemap

`createMapStyle` uses `namedFlavor("dark")`, then overrides earth, water, parks, roads, buildings, and label colors. POIs are intentionally disabled to prevent the basemap competing with missions. Road shields and one-way layers are removed.

The Protomaps `buildings` layer is replaced by `sf-buildings-3d`, a fill extrusion using source height/min-height where available. Extrusion begins flat at zoom 11 and interpolates to full source height at zoom 12.7. Color brightens by height, vertical gradient is enabled, and opacity is 0.88.

Label glyphs currently come from:

```text
https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf
```

Self-host those files if a fully offline or CSP-restricted experience is required.

## Activity-zone geometry

`activityFootprint` converts `zoneRadiusM` into an approximate 16-segment circle around `[longitude, latitude]`. Longitude degrees are corrected using the coordinate latitude. Each polygon keeps mission ID, category, color, glyph, and hotspot state.

The point and polygon are always derived from the same mission record. If a glyph and halo disagree, inspect the seed coordinate and radius rather than applying a visual offset.

## Layer order and zoom behavior

After basemap layers, Local Lore adds:

- `zone-overview-glow` and `zone-overview-edge`: hotspot polygons only, below zoom 12.35.
- `zone-glow`, `zone-fill`, `zone-volume`, `zone-edge`: detailed zones from zoom 12.2.
- `zone-hover`: raised extrusion for hovered mission.
- `zone-selected` and `zone-selected-edge`: selected mission emphasis.
- `mission-clusters` and `mission-cluster-count`: density aggregation through cluster max zoom 13.
- `mission-pulse`: animated geographic stroke around individual centers.
- `mission-glow` and `mission-dot`: readable map-aligned center treatment.
- `mission-symbol`: category glyph.
- `mission-selected`: selected center ring.
- `mission-hit`: nearly transparent 22-pixel pointer target.

Cluster radius is 34 pixels. Clicking a cluster asks the GeoJSON source for its expansion zoom and eases toward the cluster center, capped at 14.2.

## Why icons remain centered

The dot and pulse use `circle-pitch-alignment: map` and `circle-pitch-scale: map`, keeping them physically attached to the surface. The category symbol uses `icon-anchor: center`, `icon-pitch-alignment: viewport`, and `icon-rotation-alignment: viewport`. Therefore its anchor remains the geographic point while the glyph stays upright and undistorted.

Changing symbols to map alignment can make them appear flattened or rotated at high pitch. Using HTML markers can introduce separate synchronization and clustering problems. Prefer style-layer symbols.

## Icon generation

Category glyphs are small typographic characters rendered into a 64×64 canvas when the map emits `styleimagemissing` and again on load. `pixelRatio: 2` keeps them crisp. This is deterministic canvas rendering, not generated imagery.

Categories and glyphs:

| Category | Glyph |
|---|---|
| Outside | ↗ |
| Move | ⌁ |
| Make | ✦ |
| Listen | ♫ |
| Eat | ◆ |
| Learn | ◎ |
| Community | ∞ |
| After dark | ☾ |

## Interactions

MapLibre configuration explicitly enables drag pan, drag rotate, pitch with rotate, touch zoom/rotate, touch pitch, scroll zoom, box zoom, and keyboard. Cooperative gestures are disabled so normal map behavior works without modifier-key prompts.

Interactive layers are zone fill, overview glow, and mission hit. Hover resolves the mission ID, changes the zone filter, and builds a popup. Pointer leave removes the popup and clears hover. Selection filters use `__none__` when inactive.

## Custom controls

The app intentionally does not add `NavigationControl`. The three custom buttons call:

- `orbitMap`: bearing +35° and at least 48° pitch.
- `cycleTilt`: approximately 46° → 70° → 0° based on current pitch.
- `resetMap`: restore `SF_HOME` with an 850 ms ease.

Zoom remains available through direct map gestures and keyboard.

## Health instrumentation

Every ~1.2 seconds during rendering, the map element receives a JSON `data-map-health` attribute containing style/source readiness, rendered building/cluster/zone/neighborhood-label counts, and camera values. Map errors are written to `data-map-error` and logged.

This instrumentation exists for local/browser smoke tests. A ready map usually has `styleLoaded: true`, `sourceLoaded: true`, and at least some appropriate feature counts for its zoom and viewport. `zones: 0` at the initial zoom is not necessarily a failure because detailed zones begin at 12.2 and hotspot overview layers are counted separately.

## Blank-map debugging order

1. Confirm the map container has non-zero dimensions and `height: 100dvh`.
2. Read `data-map-error` and browser console errors.
3. Inspect the PMTiles request and its range response headers/status.
4. Confirm `data-map-health.styleLoaded` and `sourceLoaded`.
5. Confirm the archive URL is same-origin and not rewritten to HTML.
6. Confirm WebGL is available.
7. Confirm no second map is being created during hot reload.
8. Confirm remote glyph failures affect labels only, not the vector geometry.
9. Reset to `SF_HOME` in case the camera is at a sparse edge.

## Map change checklist

- Test initial, top-down, maximum-pitch, rotated, cluster, and close neighborhood views.
- Verify symbols remain centered on zones.
- Verify hover/select layer filters and popup cleanup.
- Verify desktop drag/right-drag/wheel and mobile pan/pinch/tilt.
- Verify All time and every filter update both map sources.
- Verify source attribution remains visible or otherwise accessible.
- Check reduced motion.
- Rebuild both production targets.
