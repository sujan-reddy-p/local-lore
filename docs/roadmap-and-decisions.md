# Roadmap and decision record

## Current phase: polished static V1 with local operations backend

The map remains the product surface with a compact visible discovery rail: search, eight interests, dates, and optional budget/time refinement. The 212-record catalog is frontend content; no source fetch or live event display is active. The gallery, duplicated quick/category/trait filters, Unicode category glyphs, and hamburger discovery paths are not part of the current UI.

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

- [x] Define PostgreSQL sources, event occurrences, run observations, decisions, and revision history.
- [x] Add repeatable catalog import and a manual candidate review CLI with audit notes.
- [ ] Configure a development database and run the migrations/import.
- [ ] Build authenticated reviewer tooling and database-backed event reads.
- [ ] Add monitoring for source failures, volume shifts, and stale records.

## Phase 4 — controlled AI assistance

- Add structured editorial proposals after deterministic facts are stable.
- Version prompts and models; store proposed patches and reviewer decisions.
- Evaluate factual preservation, duplicate suggestions, editorial quality, and false confidence.
- Never auto-publish factual changes without evidence and policy.

## Phase 5 — deeper discovery

- Distance from an explicitly shared location, with privacy-safe permission handling.
- More precise time ranges and “I have two hours” sequencing.
- Neighborhood and transit-aware browsing.
- Better route/area geometry for walks and drives using accepted native geometry; never circle approximations.
- Live conditions adapters for surf/tide/weather only from approved APIs.
- Optional lightweight submission form that creates review items, never direct publication.

## Product direction — local days and road trips

The product should answer two different questions on the same map: **what is worth doing on this date?** and **what is a realistic trip for the time I have?** The current release implements compact visible idea discovery, Bay Area calendar dates, budget and activity-time filters, honest source timing, and camera zoom through 18. It does not implement road-trip routing, a public dated-event feed, or trip feasibility; Drives is an editorial interest only and must not imply those capabilities.

### Next delivery: dated events, distinct from place ideas

- Publish a server-side read projection of validated source-backed occurrences: stable occurrence/place/source identity, timezone, start/end, publication/cancellation/expiry state, canonical link, and observation provenance. Existing database “human-approved” wording describes inactive historical workflow, not a required future gate.
- The visitor chooses a date or range. Active event results contain occurrences overlapping that interval in the event timezone; past/cancelled occurrences are absent from active results. Place ideas remain a separately labeled inspiration layer. An organizer with no upcoming events is not presented as an upcoming event.
- Show last successful source observation separately from last attempted fetch. A failed request never advances freshness. Use a source-defined freshness deadline, not an arbitrary global “stale after X days” heuristic. Missing from one snapshot does not mean cancelled.
- Acceptance: one approved real feed produces a real dated result; an empty calendar produces no upcoming-event card; a failed refresh retains the last known facts with uncertainty; date changes update both map and cards; historical records remain auditable.

### Next delivery: a real 1-day / 2-day trip planner

Start within the existing Bay Area tile footprint, including Napa/Sonoma approaches, Santa Cruz, and Monterey. Expansion beyond that boundary needs matching basemap coverage and permitted destination data; widening the UI bounds alone is not expansion.

| Input / output | Required meaning |
|---|---|
| Starting point | Explicit user-selected origin; suggest San Francisco without requiring GPS. |
| Date and trip length | Departure date, 1 day or 2 days, and a return-by time; two days can include an overnight break. |
| Driving preference | Maximum actual driving per day or leg, stated in minutes/hours—not a radius in kilometers. |
| Candidate stops | Approved places/events with location, visit duration, source timing, and opening/occurrence evidence or explicit unknowns. |
| Route legs | Real road geometry and travel duration from a permitted routing engine/provider, including the journey home; report whether traffic is modeled. |
| Itinerary | Ordered stops, driving blocks, visit time, breaks/buffer, overnight when selected, and return arrival. Keep estimated durations distinct from source facts. |

Use a discrete 1-day / 2-day choice; reserve a dial for genuinely continuous drive-time/budget constraints. Screen destinations by real road travel, then build and re-evaluate an ordered round trip. A destination being reachable does not mean the whole itinerary fits. Unknown opening hours cannot turn into “available”; show the unresolved check. Do not infer driving duration from straight-line distance or invent an AI route.

Acceptance: compare the same origin/date/destination under 1-day and 2-day constraints; a plan exceeding return-by is rejected or explicitly flagged; adding/removing/reordering a stop recomputes all legs and the return; the map displays the actual route; dated events must fit the arrival/departure window; failed/unavailable routing is explicit, not replaced with a fake straight line.

Prerequisites: a permitted routing source or self-hosted engine with regional road data, destination/source coverage outside the current city-heavy catalog, and a stable place/event read contract. Do not put a pretend trip-length dial or disabled “Road trips” mode in the public UI before those requirements are satisfied.

### AI collaboration: deliver user journeys, not random controls

The maintainer supplies product intent and source/provider permission; agents supply research, alternatives, implementation, and evidence. Before each substantial change, record the journey, current evidence, proposed contract, files/ownership, and observable acceptance in this roadmap or the focused guide. Backend owns facts/publication; frontend owns presentation and interaction; one integration owner checks the shared read contract.

Use checkpoints: **problem → evidence → decision → implemented journey → browser proof**. Examples: “find a free outdoor idea tomorrow,” “find a confirmed concert this weekend,” and later “plan a one-day round trip that gets home before 9 pm.” Each change must prove its journey locally, disclose missing prerequisites, and leave the running preview usable. Review one complete journey before broadening sources or adding more knobs.

## Recorded decisions

### MapLibre over Mapbox

Chosen for an open, token-free renderer and portable hosting. It supports the needed WebGL gestures, 3D extrusion, sources, clustering, and expressions.

### Local PMTiles over remote raster tiles

Chosen for visual control and removal of fragile third-party tile dependencies. Trade-off: the host must support range requests and the repository carries a ~29.5 MiB binary.

### OpenStreetMap/Protomaps 3D instead of photorealism

Chosen for an aesthetic, legible city model that supports discovery without the cost, tokens, privacy, or visual noise of photorealistic imagery.

### Native geometry context, not official boundaries

Activity areas are derived only from matching buildings/relevant landuse polygons in loaded native zoom-14 PMTiles tiles. The implementation preserves holes, rejects oversized or native-tile-boundary-clipped geometry, learns shapes across zooms, synchronizes visible IDs, and uses continuous area-aware fades. Unknown areas stay point artwork. These shapes are basemap context, not independently verified official venue boundaries.

### Clusters and subject-specific badges

Clusters support a large catalog without an unreadable carpet of halos. Individual activity symbols use viewport-aligned Lucide/custom rounded-square badges rather than Unicode category glyphs or purpose labels.

### Visible discovery, secondary refinement

Search, the eight interests (Anything, Food, Music, Drives, Sunsets, After dark, Make, Unusual), and dates are visible in a compact non-scrolling rail. Filters replaces the interest body with only budget and approximate activity-time sliders; time excludes travel. Reset all clears every constraint, including date. There is no gallery, duplicate quick/category/trait filter set, or hamburger discovery path.

### Deeper zoom and explicit camera controls

Camera zoom reaches 18; the existing vector archive has native tiles through 14 and is overzoomed above that. This enlarges existing geometry, not new survey detail. Plus/minus controls supplement wheel, pinch, double-click, box, and keyboard gestures. Rotate/tilt/region remain secondary map-view options.

### Any day, Today, Tomorrow, Weekend, and a date picker

Any day means unconstrained inspiration. Bay Area calendar days are computed in `America/Los_Angeles`, including DST boundaries; the upcoming weekend is Saturday/Sunday, or only the remaining Sunday when it is already Sunday. The picker accepts dates beyond seven days. Stored mission schedule filtering is not proof of a live event or confirmed opening hours.


### Static seeds before live ingestion

Chosen to prove product quality and data contract before introducing operational complexity. All seeds are visibly labeled so the prototype does not imply live verification.

### Approved adapters before AI

Facts and provenance must be deterministic. AI is an editorial and review assistant after source transport/normalization, not a free-roaming scraper.

### PostgreSQL schema and operator CLI

The schema, local commands, Neon connection, and initial catalog import are complete. No recurring schedule, deployed review service, or public event API is active. SQLite/D1 were not selected.

## Open product decisions

- Whether the public portfolio version should remain dark-only or add a fully designed light map theme.
- Whether nearby Bay missions should remain within the product promise or be labeled as optional excursions.
- Whether “Today” should be driven entirely by structured schedules once live data exists.
- How much location permission is justified for distance filtering.
- Which one official source best demonstrates the agent pipeline without licensing ambiguity.
- Whether route missions need LineString geometry in V2.
