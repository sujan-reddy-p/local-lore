# Roadmap and decision record

## Current phase: polished static V1

The objective was to prove that a useful catalog can feel alive when the map, editorial framing, and source links work together. V1 intentionally prioritizes interaction and content shape over accounts or backend complexity.

## Phase 1 — hosting confidence

- Create a preview on the chosen host.
- Prove PMTiles byte ranges and caching.
- Add repeatable Playwright or equivalent WebGL smoke coverage.
- Preserve an accessible attribution path on mobile.
- Add basic error fallback when the archive/glyphs cannot load.
- Measure map load and client bundle cost.

## Phase 2 — one real source

- Choose one official feed with explicit permission.
- Add fixtures, adapter, normalization, and policy tests.
- Add time-zone-correct schedules and expiry.
- Show verified/seed/freshness status in the UI.
- Keep all existing seed missions as a separately labeled catalog.

## Phase 3 — storage and review

- Activate a development database and migrations.
- Store sources, ingestion runs, normalized missions, and review reasons.
- Build authenticated reviewer tooling with diffs and audit notes.
- Add idempotent publish/unpublish and seed fallback.
- Add monitoring for source failures, volume shifts, and stale records.

## Phase 4 — controlled AI assistance

- Add structured editorial proposals after deterministic facts are stable.
- Version prompts and models; store proposed patches and reviewer decisions.
- Evaluate factual preservation, duplicate suggestions, editorial quality, and false confidence.
- Never auto-publish factual changes without evidence and policy.

## Phase 5 — deeper discovery

- Distance from an explicitly shared location, with privacy-safe permission handling.
- More precise time ranges and “I have two hours” sequencing.
- Neighborhood and transit-aware browsing.
- Better route/area geometry for walks and drives instead of circular approximations.
- Live conditions adapters for surf/tide/weather only from approved APIs.
- Optional lightweight submission form that creates review items, never direct publication.

## Recorded decisions

### MapLibre over Mapbox

Chosen for an open, token-free renderer and portable hosting. It supports the needed WebGL gestures, 3D extrusion, sources, clustering, and expressions.

### Local PMTiles over remote raster tiles

Chosen for visual control and removal of fragile third-party tile dependencies. Trade-off: the host must support range requests and the repository carries a ~29.5 MiB binary.

### OpenStreetMap/Protomaps 3D instead of photorealism

Chosen for an aesthetic, legible city model that supports discovery without the cost, tokens, privacy, or visual noise of photorealistic imagery.

### Geographic zones instead of pins

Chosen because an activity often occupies a place, route, park, venue, or neighborhood footprint. The zone communicates “something happens here” while category glyphs carry fast meaning.

### Clusters at city scale, individual zones at neighborhood scale

Chosen to support a large catalog without rendering an unreadable carpet of halos.

### Viewport-aligned symbols over HTML markers

Chosen so glyphs remain upright and centered during 3D pitch/rotation and participate cleanly in MapLibre source/layer logic.

### Full-screen map with compact overlay brand

The original top bar consumed space and distracted from the city. It was removed; identity and date context remain inside the map overlay.

### No plus/minus controls

Direct scroll, pinch, double-click, box, and keyboard zoom already exist. Removing redundant controls reduces chrome. Rotate, tilt, and whole-city remain because they are less discoverable gestures.

### All time plus seven dates

Seven dates keep event planning bounded and understandable. All time ensures evergreen, future, and inspiration-oriented missions never disappear simply because their schedule is not active today.

### Static seeds before live ingestion

Chosen to prove product quality and data contract before introducing operational complexity. All seeds are visibly labeled so the prototype does not imply live verification.

### Approved adapters before AI

Facts and provenance must be deterministic. AI is an editorial and review assistant after source transport/normalization, not a free-roaming scraper.

### Omit imagery when rights are unclear

The no-image category treatment is a complete visual state. Only documented licensed images are shown; no generated images are used.

### SQLite/D1 schema remains inactive

Chosen to keep V1 portable while establishing concrete future tables. Activation waits for an end-to-end permissioned adapter and review workflow.

## Open product decisions

- Whether the public portfolio version should remain dark-only or add a fully designed light map theme.
- Whether nearby Bay missions should remain within the product promise or be labeled as optional excursions.
- Whether “Today” should be driven entirely by structured schedules once live data exists.
- How much location permission is justified for distance filtering.
- Which one official source best demonstrates the agent pipeline without licensing ambiguity.
- Whether route missions need LineString geometry in V2.
