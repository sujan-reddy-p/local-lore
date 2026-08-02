# Source ingestion and AI curation

## Goal

The long-term portfolio story is an AI-agent-assisted city catalog, but the agent must increase useful volume without weakening factual trust. The system is designed around approved sources, deterministic parsing, provenance, review, and expiry. It is not an unrestricted web scraper.

## Intended flow

```text
source registry
→ permission gate
→ source-specific fetch adapter
→ deterministic normalization
→ optional AI editorial proposal
→ validation and dedupe
→ review queue
→ publish transaction
→ refresh, miss handling, and expiry
```

## Source registry and policy

Every adapter exposes:

- stable key and display name;
- kind: official calendar, public feed, organizer page, or curated seed;
- canonical source URL and attribution;
- optional terms URL;
- whether automated fetching is allowed;
- whether image reuse is allowed;
- refresh cadence in minutes.

`canRun` returns true only for permissioned automated sources and excludes organizer pages. `runAdapter` also refuses `allowsAutomatedFetch: false`. Before a live scheduler exists, consolidate these gates so there is one authoritative policy decision and test both allowed and denied cases.

Preferred inputs are official public APIs, documented RSS/Atom/ICS/JSON feeds, city-agency datasets, cultural-institution calendars, and organizer-maintained feeds. A normal webpage is not permission to crawl it.

## Adapter contract

An adapter implements:

```ts
interface SourceAdapter {
  key: string;
  sourceName: string;
  policy: SourcePolicy;
  fetch(signal?: AbortSignal): Promise<RawSourceRecord[]>;
  normalize(record: RawSourceRecord, checkedAt: string): NormalizedMission | null;
}
```

`fetch` handles only source transport and should support cancellation. `normalize` must be deterministic for factual fields. Returning `null` means the raw item cannot safely become a mission.

Source adapters should include fixtures and tests for schema changes, missing fields, time zones, pagination, rate limits, cancellations, malformed records, and duplicate external IDs.

## Normalized record

`NormalizedMission` is `LoreItem` without local ID plus:

- `externalId`: stable source-owned identity;
- `confidence`: normalization/publish confidence from 0 to 1;
- `lastSeenAt`: source observation time.

The adapter must preserve the canonical organizer URL. Any AI stage receives normalized facts and their provenance; it does not fetch arbitrary pages on its own.

## AI responsibilities

An AI model may propose:

- original Local Lore title, kicker, description, and why;
- category and format;
- vibes and traits;
- likely duplicate groups;
- confidence and a concise reviewer rationale;
- whether a source change appears editorial or factual.

An AI model must not invent or infer without evidence:

- event date or time;
- price, discount, availability, or ticket status;
- address, venue, coordinate, neighborhood, or distance;
- age, skill, accessibility, pet, or safety claim;
- organizer identity or canonical URL;
- image license or credit;
- weather, tide, surf, or other conditions.

Store model name/version, prompt version, input record hash, proposed patch, confidence, and reviewer decision for auditability. AI output should be structured JSON validated against a schema, never directly interpolated into storage.

## Current deterministic validation

`runAdapter`:

1. refuses an adapter without automated-fetch permission;
2. calls `fetch` and `normalize`;
3. rejects normalized nulls and counts them;
4. requires an HTTPS source URL;
5. bounds coordinates to longitude −122.62…−122.25 and latitude 37.60…37.94;
6. sends confidence below 0.78 to review;
7. marks expired records for review;
8. detects within-run duplicates using normalized title, venue, and coordinates rounded to three decimals;
9. generates an 18-character SHA-256-derived ID from source key plus external ID for publishable records.

Records with any reason enter review; otherwise the adapter metadata fields are removed and the record becomes `LoreItem`.

## Review reasons

- `low-confidence`
- `missing-source`
- `invalid-location`
- `duplicate`
- `expired`

A production review system should add source schema change, ambiguous time zone, material factual conflict, license uncertainty, accessibility uncertainty, and significant content change.

## Dedupe strategy evolution

The V1 fingerprint only catches close same-run duplicates. A live system should stage dedupe:

1. exact source key/external ID;
2. canonical URL identity;
3. normalized venue plus start time;
4. title similarity within a geographic/time window;
5. AI suggestion for ambiguous cross-source duplicates;
6. human merge decision preserving every provenance link.

Never discard alternate provenance merely because two records merge.

## Refresh and expiry semantics

- A successful source sighting updates `lastSeenAt`.
- One missing run should not immediately delete an evergreen record.
- Scheduled events disappear after their end/expiry while remaining stored for audit.
- Recurring missions should be revalidated on the source cadence.
- A failed source run must not mass-expire its catalog.
- Material source changes should create a review diff before overwriting published facts.
- The UI should eventually communicate last verified time and degraded freshness.

## Scheduling and operations

Start with one daily permissioned adapter. Record run start/end, counts, error, source ID, and review count. Add idempotency so retrying the same source snapshot cannot duplicate missions. Apply rate limits, timeouts, backoff, and a descriptive user agent where source terms require it.

Operational alerts should cover consecutive failures, a major count drop/spike, parsing rejection rate, abnormal review volume, expired-but-visible records, and broken canonical URLs.

## Safe implementation order

1. Select one official feed with explicit automation permission.
2. Add policy registry entry, fixtures, adapter, and tests.
3. Persist ingestion runs only.
4. Persist normalized missions and review reasons in a transaction.
5. Build a read-only review view.
6. Add explicit approve/reject with audit note.
7. Publish through a repository returning `LoreItem[]`.
8. Add a scheduler after manual runs are repeatable.
9. Introduce AI proposals last, behind structured validation and audit logs.

This order makes the AI layer a controlled multiplier rather than the foundation of factual correctness.
