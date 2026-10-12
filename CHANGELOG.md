# Changelog

## Unreleased

- Aligned active discovery instructions with the local scripts: `openai-codex/gpt-6-luna` is the default, access is assessed agentically without a mandatory human approval step, and actual source access/image rights remain required. Daily discovery uses an isolated ignored worktree, refuses dirty or outdated roots, commits only processed catalog/state files, and leaves a local commit to push if push fails. Installed 08:17 local launchd scheduling from `~/Projects/local-lore`; actual manual and launchd-triggered runs completed as validated no-ops.
- Clarified that the 350–500 experience range and 75 km Bay Area cutoff are research goals/limits, not achieved coverage; documented honest locator halos, sourced start-first route geometry shown on hover/selection, and grouped dated-event choices.
- Published an actual locally researched baseline of 225 records across 178 sources: 13 new nearby activities/events, preserved evergreen parents, honest unknown facts, and supported refreshes. Added behavioral evidence/DST/retirement/deduplication coverage; all 26 tests pass.
- Fixed stale live map scenes through current Effect Event state, preserving camera and selected IDs on catalog updates. Indoor “walk into” activities no longer receive running artwork/routes. Regional metadata and share images now use Bay Area copy and the same local badges.
- Corrected manual research examples to keep proposals and isolated state/catalog copies under ignored `outputs/`; documented the durable maintained checkout and observed scheduler behavior.
- Replaced asynchronous per-marker artwork registration with generated native 1×/2× MapLibre sprites. Fresh Chromium startup registers all 20 badges before symbol rendering, eliminating the observed missing-image race without hiding warnings.

- Established the local-Mac-only publication boundary: launchd scheduling, isolated daily runs, dirty-repository refusal, validate/build before copy-back, and commits limited to processed catalog/state files. Raw proposals, logs, pages, and credentials remain local.
- Established the agentic Git catalog publication path: structured source research, deterministic validation, bounded snapshots, and honest publish/revert behavior without a mandatory human approval queue. Retained access controls, rights, security, provenance, and no-invention rules; documented inactive database review/publication history.
- Added the authoritative `docs/content-maintenance.md` procedure for source checks, add/update/remove/retire, geography and coverage signals, null price/duration semantics, event dates, route evidence, validation, publication, and revert.

- Replaced hamburger/gallery discovery with one compact search panel, eight non-scrolling interests, and bottom date controls. Filters now contain only budget and approximate activity-time sliders; complete reset remains available.
- Raised camera zoom from 14 to 18 while keeping native vector tiles capped at 14; cluster expansion and selected-item focus now support closer views.
- Added Bay Area calendar-day filtering for Today, Tomorrow, Weekend, and arbitrary picker dates, including DST/weekend/year boundaries. Cards/details distinguish curated ideas, verified listings, source directories, historical checks, and unknown schedules.
- Recorded an evidence-based dated-event/1-day–2-day road-trip direction and AI collaboration acceptance workflow. No simulated routing, live feed, or backend cutover is introduced by this UI release.
- Replaced generated circular activity footprints with accepted containing building/landuse shapes from the local PMTiles basemap, retaining holes and rejecting oversized or tile-clipped geometry. Unknown areas remain honest point locators with halos when polygons are absent or too visually small; halos fade as genuine polygons become legible. Learned outlines persist across zooms with size-aware fading.
- Added 20 subject-specific Lucide-derived rounded-square map artworks, editable SVGs, retina PNGs, a reproducible generator, and ISC/MIT notices; removed Unicode category glyphs.
- Overhauled selected cards with retained photography, a strong place heading, short activity explanations for all 212 current missions, and readable time/cost/company facts. Required source/accessibility/photo information is in an inline Info disclosure; missing or failed photos use a compact truthful artwork fallback.
- Removed the redundant hover action and suppressed hover previews for the selected mission. Shared image state recovers when switching directly from a failed photo to another mission.
- Added browser-permission location centering on deployed secure hosts, with bounds, denial/retry, and late-callback navigation protection; localhost stays fixed and never requests location. GPS is not stored or sent.
- Documented frontend/backend ownership and researched design-review rules in existing guides; map gestures remain unchanged.
- Replaced the San Francisco-only tiles with a 91.9 MB Protomaps/OpenStreetMap regional archive covering the Bay Area from Napa/Sonoma to Monterey; shared bounds now also gate ingestion coordinates.
- Historical source/image permission workflows required explicit human control; the active local publisher now lets its researcher assess documented access, while actual access conditions, image reuse rights, and all provenance rules remain binding.
- Grouped the complete 212-record catalog under 165 source groups and preserved content, images, links, dates, and original display order. Existing records are marked `approved_for_display` under the maintainer’s assumption, not an independent audit.
- Historical PostgreSQL work synchronized 165 source groups and 212 records. The catalog importer and its package entrypoint are now removed: website content publishes only through the Git catalog, while `db:setup` applies migrations for optional visitor storage.
- Historical event-ingestion and candidate-review schemas remain inactive. They are not a mandatory approval queue or a second publication path.
- Retained parser/normalizer edge-case coverage; removed the unused legacy pipeline. Local scheduling is provided by the new launchd runner, not the historical database collector.
- Retained historical source-audit evidence and parser coverage; removed the superseded source-auditor profile and obsolete runnable command guidance.

- Removed the unused Cloudflare/Vinext worker runtime. Local development and Vercel now use one native Next.js path on port 4317.

## 0.1.0 — Portfolio V1

### Product

- Built a standalone, account-free San Francisco map discovery experience.
- Added an initial 112 realistic curated seed missions across eight categories and numerous traits and formats.
- Expanded the static catalog by 100 source-attributed curated-seed missions, bringing the total to 212, with much broader food, live music, parks, culture, movement, volunteering, and after-dark coverage.
- Replaced generic category-only preview art with venue-and-neighborhood visual panels; retained licensed Wikimedia imagery only where complete attribution and licensing metadata exists.
- Added editorial prompts, search, category, time, budget, trait, quick, date, and All-time discovery.
- Synchronized every filter to both map GeoJSON sources so non-matching zones, icons, and clusters vanish together.
- Added hover previews, rich mission details, source links, attribution, schedule reminders, and optional licensed imagery.
- Replaced the numeric mission inventory/list presentation with a wider, image-and-glyph card gallery and removed visible mission totals.

### Map

- Implemented MapLibre, Protomaps, OpenStreetMap data, and a local PMTiles archive.
- Added bounded Bay-area navigation, 3D buildings, city/road/park/neighborhood labels, clustering, activity-zone polygons, and viewport-aligned glyphs.
- Enabled pan, scroll/pinch zoom, rotation, tilt, keyboard navigation, touch pitch, and cluster expansion.
- Added compact rotate, tilt, and whole-city controls; removed the header and native `+`/`−` controls.
- Added animated zone centers with reduced-motion support.

### Architecture

- Added typed mission, image, schedule, trait, source-policy, adapter, and normalization contracts.
- Added deterministic stable IDs, coordinate/source/confidence/duplicate/expiry validation, and a review boundary.
- Added a Drizzle/SQLite schema and migration for sources, missions, schedules, ingestion runs, and review queue.
- Added vinext/Cloudflare and Next.js/Vercel build paths.
- Removed unused template authentication, note examples, and starter assets; added a documented range-aware local production server command.

### Trust and quality

- Marked all current data as `curated-seed` and retained direct organizer/agency links.
- Added licensed Wikimedia images to three records only; all other records use category treatments.
- Added lint, strict typecheck, production builds, rendered HTML tests, map-health instrumentation, responsive styles, and accessibility safeguards.
