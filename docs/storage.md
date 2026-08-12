# Storage architecture

## Current state

The deployed page imports the published missions from `lib/seed-data.ts`. The catalog does not read Neon, but the server-only `POST /api/visitor` route uses Neon to record visitor IPs. Browser code never receives database credentials.

## Catalog database choice

Neon Postgres is the selected database option for server-side features, accessed through Drizzle and `pg`. The catalog tables remain an inactive prototype; visitor capture is the first active database-backed web route.

## Tables

### `sources`

Stores the approved source registry: stable key/name/kind, canonical and terms URLs, attribution, automation and image permissions, refresh cadence, enabled state, and timestamps. Source key is unique.

### `missions`

Stores normalized content and facts, location/radius, time label/duration/price, JSON vibes/traits/image, source URL/check date, confidence, lifecycle status, seen/published/expiry timestamps, and source/external identity. `(source_id, external_id)` is unique.

Indexes support status/category, neighborhood/status, and freshness queries.

### `ingestion_runs`

Tracks source run status, fetched/normalized/review counts, start/end, and error. This table is the operational audit surface and should be written even if a run publishes nothing.

### `source_observations`, `candidate_decisions`, and `mission_revisions`

Source observations store HTTP freshness details and extraction counts. Candidate decisions record deterministic publish/discard outcomes and reasons. Mission revisions retain agent before/after snapshots when an existing mission changes. The current product deliberately has no human-review queue.

## Migration files

- `db/schema.ts` is the typed source of truth.
- `drizzle.config.ts` targets Postgres and writes to `drizzle/postgres/`.
- `drizzle/postgres/` contains the applied migration history for Neon.
- `npm run db:generate` generates future migrations after schema changes.

Never edit migration metadata casually after it has been applied to a shared environment. Create a new migration.

## Recommended repository boundary

Do not import Drizzle rows directly into map components. Add a server-side repository with methods such as:

```ts
listPublishedMissions(window): Promise<LoreItem[]>
upsertNormalizedMission(input): Promise<StoredMission>
enqueueReview(missionId, reasons): Promise<void>
recordIngestionRun(result): Promise<void>
```

Conversion code should parse JSON columns, resolve schedules, and return the existing `LoreItem` contract.

## Activation plan

1. Add more explicitly permissioned public feeds to the source directory.
2. Add repository tests with isolated data.
3. Confirm freshness and expiry behavior with live feed fixtures.
4. Expand source observation monitoring and rollback instructions.
5. Keep the static seed fallback for database outages.

## Data integrity rules

- Source plus external ID is the ingestion identity.
- Published records require a canonical source, valid coordinates, valid schedule/location normalization, and deterministic acceptance.
- Source facts and AI editorial proposals should be separable in audit history.
- Expiry should change visibility/status, not destroy provenance.
- Run writes and mission/decision writes should be transactional when possible.
- Never expose a D1 or database binding to browser code.

## Object storage

R2 is currently disabled. Do not mirror remote images into storage without checking license and organizer terms. If object storage is introduced for permitted media, preserve original source, license, credit, checksum, fetch time, transforms, and deletion policy.
