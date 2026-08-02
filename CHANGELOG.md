# Changelog

## 0.1.0 — Portfolio V1

### Product

- Built a standalone, account-free San Francisco map discovery experience.
- Added 112 realistic curated seed missions across eight categories and numerous traits and formats.
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
