# Catalog and data model

## Current catalog

`data/source-catalog.json` stores the catalog grouped by its 165 source entries. The 212 records are nested under the source that owns their canonical URL; the separate `lib/seed-data.ts` adapter reconstructs the existing `LoreItem` UI contract. `catalogOrder` preserves the prior display order.

The maintainer explicitly asked that every item already shown on the site be treated as accurate and retained. All 212 records are therefore marked `approved_for_display` under `approvalBasis: maintainer_assumed_accurate_for_existing_site_content`. This records the maintainer’s assumption, not an independent factual audit. The prior shared `lastCatalogCheckedAt: 2026-08-02` remains historical, not a live check. Display approval, automated-fetch permission, and image-reuse permission remain separate.

These records are mostly editorial missions and venue/organizer references, not a feed of 212 dated events. The Postgres `missions` table preserves this catalog representation. A separate `event_occurrences` model now stores dated, source-derived event candidates and published occurrences.

The catalog spans eight categories: Outside, Move, Make, Listen, Eat, Learn, Community, and After dark. Formats provide a second axis: Adventure, Class, Culture, Food, Live, Market, Meetup, and Volunteer.

## Source group contract

Each source group in `data/source-catalog.json` contains:

- `source`: stable ID/key, canonical URL, attribution, existing automation/image permissions, enabled state, and refresh configuration.
- `reviewStatus`: `approved_for_display` for existing populated groups under the maintainer’s assumption; `needs_source_review` for a source-only lead.
- `lastCatalogCheckedAt`: the historical seed stamp, or `null` when the group has no seed record.
- `records`: source-owned records with a stable `id`, `catalogOrder`, and `reviewStatus: approved_for_display`.

Do not infer source-specific fetch instructions or permission from a URL or public visibility. Automated collection additionally requires `allowsAutomatedFetch: true` and `enabled: true`. Do not create a separate file per mission.

## `LoreItem` publish contract

| Field | Type and meaning |
|---|---|
| `id` | Stable unique string used by React, GeoJSON features, selection, and future persistence. |
| `title` | Editorial mission instruction, not merely a venue name. |
| `kicker` | Short atmospheric or practical hook. |
| `description` | What the visitor should do. |
| `why` | Why the mission is distinctive or worth the time. |
| `category` | One of the eight product categories. |
| `neighborhood` | Human-readable map context. |
| `venue` | Specific place or organizer venue. |
| `coordinates` | `[longitude, latitude]` numeric tuple. |
| `zoneRadiusM` | Legacy hint retained in catalog data; never treated as a physical boundary. |
| `map` | Optional context: `kind` is `area`, `venue`, or `route`; `route` may contain a genuine sourced `[longitude, latitude][]` line and `sourceUrl`. Without genuine geometry, route rendering is start-first. |
| `time` | Human-readable schedule guidance shown in cards. |
| `timeSlot` | Coarse `Now`, `Tonight`, or `Weekend` filter value. |
| `duration` | Approximate hours, or `null` when the source does not state one; render as “Time varies”. |
| `price` | Dollar number, or `null` when unlisted; render as “Not listed”. Zero renders as Free. |
| `vibe` | Combination of solo, friends, outdoors, quiet, and social. |
| `accessibility` | Short, cautious access or terrain note. |
| `source` | Derived from its owning source group: name, HTTPS URL, status, and legacy check date. |
| `format`, `traits`, `schedule`, `image`, `hotspot`, `featured` | Optional presentation, availability, and image metadata. |

## Schedule model and limitation

`MissionSchedule` supports evergreen, recurring, scheduled, seasonal, and conditions-based availability, with optional weekdays, explicit dates, and start/end/expiry bounds. If no schedule is present, Weekend missions default to recurring Saturday/Sunday; other missions default to evergreen. This is an app display rule, not evidence that an event is currently happening.

`lib/availability.ts` now uses `America/Los_Angeles` calendar days for date choices, weekend selection, weekdays, and schedule bounds, including timestamp bounds and DST/year transitions. This makes filtering consistent across visitor timezones, not live: `MissionStatus` uses only the explicit schedule, otherwise reports it unconfirmed. Real live events still require distinct published occurrences, source observations, and expiry/cancellation facts.

## Event dates and rendering

An explicit source-backed event occurrence may carry a genuine start/end date and source timezone. Render that occurrence’s date as sourced; do not derive a date from a recurring idea, browser timezone, or a missing field. Past occurrences expire independently. “Not seen” or a failed fetch preserves the last good record and is not cancellation evidence. Retire an occurrence only for explicit, sourced cancellation or closure.

## Data checks and editing

Run `npm run catalog:validate` after editing the source catalog. It checks source keys/URLs, duplicate IDs and ordering, review labels, geographic coordinate syntax, and local image files.

Migration checks confirm the catalog’s structure, IDs, source URLs, ordering, coordinates, and local image paths; they do not prove factual or schedule accuracy. Existing visible content is retained by the maintainer’s instruction. Do not imply that the migration re-verified venue alignment, current hours, prices, accessibility, or source rights.

For a source review:

1. Open the canonical source and record the source’s actual event/venue facts separately from Local Lore’s editorial framing.
2. Check whether a record describes an evergreen experience, a recurring program, or one dated occurrence.
3. Confirm coordinates, schedule, price, accessibility, and image rights independently where applicable.
4. Record the human decision and evidence in that source group; retain rejected or uncertain legacy records in the archive with a status rather than deleting their provenance.
5. Validate the data and inspect the local map before publishing.

## Image record and fallback

`MissionImage` stores URL, alt text, credit, original source URL, and optional license. The migrated file carries the existing image metadata inside each mission record; `lib/mission-images.ts` is no longer a second source of truth. The catalog validator checks local image paths. If reuse permission is unclear, omit the image and use the venue-and-neighborhood visual treatment.

## Database boundary

GitHub stores the versioned catalog, source definitions, parser code, and reviewed schema changes. The existing Neon/Postgres database now contains the imported catalog and operational schema. The UI still bundles `data/source-catalog.json`; it does not query the database for catalog or event data.
