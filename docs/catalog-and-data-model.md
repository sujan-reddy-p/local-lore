# Catalog and data model

## Current catalog

`data/source-catalog.json` stores display-eligible source-grouped records. The server projects `LoreItem`, excluding raw audit evidence and discovery state. `websiteUrl` is the visitor action; `source.url` is evidence. Incomplete leads and generic filler are not published. Research is resumed, data first and final UI/design afterward. Target 100 distinct worthwhile things per major city, reporting places/activities, programs, and upcoming events separately without duplicates. Derive current coverage from records and Census boundaries, not historical totals.

The catalog spans eight categories: Outside, Move, Make, Listen, Eat, Learn, Community, and After dark. Formats provide a second axis: Adventure, Class, Culture, Food, Live, Market, Meetup, and Volunteer.

## Source group contract

Each source group in `data/source-catalog.json` contains:

- `source`: stable ID/key, canonical URL, attribution, existing automation/image permissions, enabled state, and refresh configuration.
- `reviewStatus`: `approved_for_display` for existing populated groups under the maintainer’s assumption; `needs_source_review` for a source-only lead.
- `lastCatalogCheckedAt`: the historical seed stamp, or `null` when the group has no seed record.
- `records`: source-owned records with a stable `id`, `catalogOrder`, and `reviewStatus: approved_for_display`.

Never infer fetch permission from a URL or public visibility. Historical approval/review labels are lineage and eligibility state, not current human approval gates or evidence of accuracy, access permission, or rights.

## `LoreItem` publish contract

| Field | Type and meaning |
|---|---|
| `id` | Stable unique string used by React, GeoJSON features, selection, and future persistence. |
| `title` | Editorial mission instruction, not merely a venue name. |
| `kicker` | Short atmospheric or practical hook. |
| `description` | Canonical plain-language visitor action, rendered directly by hover and selected cards. No frontend ID-based wording override. |
| `why` | Why the mission is distinctive or worth the time. |
| `category` | One of the eight product categories. |
| `neighborhood` | Human-readable map context. |
| `venue` | Specific place or organizer venue. |
| `coordinates` | `[longitude, latitude]` numeric tuple. |
| `map` | Optional context: source-backed Polygon/MultiPolygon including holes, with string evidence and source URL; legitimate matching native outline is secondary. Every mission retains a 25–100 m ground locator circle fallback, never a physical footprint. Routes are start-first; typed exact source course or exactly two geocoded actual connection endpoints only. |
| `time` | Human-readable schedule guidance shown in cards. |
| `timeSlot` | Coarse `Now`, `Tonight`, or `Weekend` filter value. |
| `duration` | Approximate hours, or `null` when the source does not state one; render as “Time varies”. |
| `price` | Dollar number, or `null` when unlisted; render as “Not listed”. Zero renders as Free. |
| `vibe` | Combination of solo, friends, outdoors, quiet, and social. |
| `accessibility` | Short, cautious access or terrain note. |
| `source` | Derived from its owning source group: name, HTTPS URL, status, and legacy check date. |
| `format`, `traits`, `schedule`, `image`, `hotspot`, `featured` | Optional presentation, availability, and image metadata. |

## Schedule model and limitation

`MissionSchedule.kind` uses canonical values including `scheduled`, not `dated`; scheduled occurrences use `startsAt` and `endsAt`, not `start`/`end`. `lib/availability.ts` uses `America/Los_Angeles` calendar days for date choices and schedule bounds. A date-only end is inclusive through its Bay Area calendar day; timestamp expiry is at the exact instant, including offset timestamps. Evergreen and ongoing recurring activities have no arbitrary TTL. These are filtering rules, not live confirmation.

Scheduled ranges with a valid start and end/expiry match their inclusive Bay Area days even without an explicit `dates` list. An explicit date list takes precedence; weekday restrictions still apply to ranges. An expiry alone does not establish a start date or invent availability.

Recurring monthly weekdays use `monthly: [{ dayOfWeek: 0, weeks: [1, 3] }]` for first/third Sundays. Weekdays are 0–6 (Sunday–Saturday); occurrence numbers are 1–5 within each month. Multiple monthly rules and `daysOfWeek` are alternatives, not intersections: Monday/Thursday plus second Sunday is `{ kind: "recurring", daysOfWeek: [1, 4], monthly: [{ dayOfWeek: 0, weeks: [2] }] }`. Preserve the actual recurrence; never replace a monthly program with every week or a finite invented date list. A scheduled event with only a sourced start time may use date-only `expiresAt` without inventing its end time.

## Event dates and rendering

Scheduled occurrences carry source-backed dates and finite expiry/end data. Date-only end dates remain valid through their Bay Area calendar day; timestamps expire at their exact instant. A failed fetch or “not seen” preserves the last good record and is not cancellation evidence. Retire only with explicit sourced cancellation or closure.

## Data checks and editing

Run `npm run catalog:validate` after editing the source catalog. It checks source keys/URLs, duplicate IDs and ordering, review labels, geographic coordinate syntax, and local image files.

Migration checks confirm the catalog’s structure, IDs, source URLs, ordering, coordinates, and local image paths; they do not prove factual or schedule accuracy. Existing visible content is retained by the maintainer’s instruction. Do not imply that the migration re-verified venue alignment, current hours, prices, accessibility, or source rights.

For a source review:

1. Open the canonical source and record the source’s actual event/venue facts separately from Local Lore’s editorial framing.
2. Check whether a record describes an evergreen experience, a recurring program, or one dated occurrence.
3. Confirm coordinates, schedule, price, accessibility, and image rights independently where applicable.
4. Record supported evidence and retain uncertain legacy records with their provenance and existing lineage state; historical review labels are not a current approval gate.
5. Validate the data and inspect the local map before publishing.

## Image record and fallback

`MissionImage` stores URL, alt text, credit, source URL, and optional license. Image preference is authorized event image, suitable venue image, then logo; require direct URL and explicit reuse evidence. Image state is keyed by URL and image kind so switching between photo/logo resets failures. Missing/failed photos use UI-owned subject artwork; do not substitute stock or generate catalog photos.

During the current data-first round, all newly researched image candidates are staged privately without chasing reuse permission. A verified record may be published with existing authorized media or UI-owned artwork while its private image awaits review; image review is not a general content approval gate.

## Database boundary

GitHub stores the versioned catalog, source definitions, parser code, and reviewed schema changes. The existing Neon/Postgres database now contains the imported catalog and operational schema. The UI still bundles `data/source-catalog.json`; it does not query the database for catalog or event data.
