# Catalog and data model

## Current catalog

`lib/seed-data.ts` exports 212 `LoreItem` records. They are compiled into the app and filtered client-side. The file uses a shared helper to stamp every source with status `curated-seed` and checked date `2026-08-02`. The 100-mission expansion is authored through the local `mission()` helper in the same file so the full publish boundary remains `LoreItem`.

The catalog spans eight categories: Outside, Move, Make, Listen, Eat, Learn, Community, and After dark. Formats provide a second axis: Adventure, Class, Culture, Food, Live, Market, Meetup, and Volunteer. Traits support high-intent discovery such as dog-friendly, photogenic, date idea, family, weird, cozy, scenic, drive, romantic, and social.

## `LoreItem` contract

| Field | Type and meaning |
|---|---|
| `id` | Stable unique string used by React, GeoJSON features, selection, and future persistence. |
| `title` | Editorial mission instruction, not merely a venue name. |
| `kicker` | Short atmospheric or practical hook. |
| `description` | What the visitor should do. |
| `why` | Why the mission is distinctive or worth the time. |
| `category` | One of the eight product categories. |
| `neighborhood` | Human-readable map context. |
| `venue` | Specific official place/organizer venue. |
| `coordinates` | `[longitude, latitude]` numeric tuple. |
| `zoneRadiusM` | Approximate geographic footprint in meters. |
| `time` | Human-readable schedule guidance shown in cards. |
| `timeSlot` | Coarse `Now`, `Tonight`, or `Weekend` filter value. |
| `duration` | Approximate hours required. |
| `price` | Dollar number; zero renders as Free. |
| `vibe` | Combination of solo, friends, outdoors, quiet, and social. |
| `accessibility` | Short, cautious access or terrain note. |
| `source` | Name, HTTPS URL, `curated-seed` status, checked date. |
| `accent` | CSS-compatible mission color used by map and cards. |
| `distance` | Prototype display string; not currently computed from user location. |
| `format` | Optional explicit mission format; otherwise category fallback is used. |
| `traits` | Optional high-intent discovery facets. |
| `schedule` | Optional structured availability. |
| `image` | Optional permissioned image metadata. |
| `hotspot` | Shows a broader overview polygon at city zoom. |
| `featured` | Reserved editorial flag; not currently a separate UI filter. |

## Schedule model

`MissionSchedule` supports:

- `kind`: evergreen, recurring, scheduled, seasonal, or conditions.
- `daysOfWeek`: JavaScript day numbers, Sunday 0 through Saturday 6.
- `dates`: explicit `YYYY-MM-DD` values.
- `startsAt`, `endsAt`, `expiresAt`: date boundaries.

`missionSchedule` uses the explicit schedule when present. If absent, Weekend missions become recurring on Saturday/Sunday and all others become evergreen. `isAvailableOn` first applies expiry/start/end bounds, then exact scheduled dates, then recurring days.

The UI generates seven dates from local “today” normalized to noon. All time returns `null` as selected date and skips `isAvailableOn`, which is why scheduled records with no matching current date still remain discoverable.

### Scheduling limitation

Date values are ISO strings but the helper uses `toISOString`, while display and JavaScript weekday use the browser environment. This can create time-zone edge cases around midnight. A live version should use explicit `America/Los_Angeles` calendar semantics and a temporal/date library or server-normalized date keys.

## Filter semantics

- All dimensions combine with AND.
- Curiosity is single-select.
- Traits require every selected trait.
- Today removes coarse Weekend items in addition to date availability.
- Sunset means Tonight plus outdoors or scenic.
- Live music means Listen category or Live format.
- Scenic drive means the drive trait.
- Text tokens must all appear somewhere in the aggregated mission haystack.

## Adding a seed mission

1. Open and verify an authoritative canonical source.
2. Confirm the actual coordinates independently and use longitude first.
3. Pick a radius that represents the activity, not an arbitrary uniform halo.
4. Write original title, kicker, description, and why.
5. Fill factual fields conservatively; use schedule reminder language when data is not live.
6. Add explicit schedule structure where the source clearly provides it.
7. Add useful traits without over-tagging.
8. Add an image only under the documented image policy.
9. Run tests and visually inspect the map coordinate/zone at neighborhood zoom.
10. Update tests if the catalog count changes.

## Content QA rules

- The venue, neighborhood, coordinate, and source must refer to the same place.
- Price should represent a realistic entry or participation cost, not an unverified deal.
- Duration describes the proposed mission rather than venue opening hours.
- Accessibility wording must distinguish known accessible routes from uneven terrain and should link to the organizer for definitive accommodations.
- Source URL should be the actionable visitor/organizer page, not a search result or aggregator when a primary page exists.
- Temporary events need explicit dates and expiry.
- Conditions-based missions need a trustworthy conditions source in the future, not a fabricated prediction.
- A single venue can support multiple missions only when the editorial activity and geographic footprint are meaningfully distinct.

## Image record and visual fallback

`MissionImage` requires URL, alt text, credit, original source URL, and optional license. The optional type does not mean licensing is optional in product policy: if reuse permission cannot be established, do not add the image. The UI uses a venue-and-neighborhood visual panel with the existing category glyph as the fallback; it must not use a copied organizer photo merely to fill the space.

## Future database mapping

The current database schema separates source registry fields from mission rows and schedules. Arrays/images are stored as JSON text in the initial SQLite design. A repository/API layer should convert persisted rows back into the exact `LoreItem` publish shape so presentation code remains independent of storage.
