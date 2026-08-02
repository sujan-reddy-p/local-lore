# Storage architecture

## Current state

The production UI does not read or write a database. The catalog is a TypeScript array compiled into the client. `.openai/hosting.json` contains `d1: null` and `r2: null`, so Vite creates no database or object-storage binding.

The schema and migration are intentional forward architecture, not evidence that persistence is live.

## Database choice

V1 scaffolding uses Drizzle with SQLite syntax so it can map naturally to Cloudflare D1. The original concept allowed PostgreSQL/Supabase later; moving to Postgres remains possible because source IDs, mission IDs, status fields, and relational boundaries are portable, but the generated migration is SQLite-specific.

## Tables

### `sources`

Stores the approved source registry: stable key/name/kind, canonical and terms URLs, attribution, automation and image permissions, refresh cadence, enabled state, and timestamps. Source key is unique.

### `missions`

Stores normalized content and facts, location/radius, time label/duration/price, JSON vibes/traits/image, source URL/check date, confidence, lifecycle status, seen/published/expiry timestamps, and source/external identity. `(source_id, external_id)` is unique.

Indexes support status/category, neighborhood/status, and freshness queries.

### `mission_schedules`

Separates mission lifecycle from schedule windows and recurrence rules. It defaults to `America/Los_Angeles`, indexes time windows and mission ID, and cascades when a mission is removed.

### `ingestion_runs`

Tracks source run status, fetched/normalized/review counts, start/end, and error. This table is the operational audit surface and should be written even if a run publishes nothing.

### `review_queue`

Stores mission-linked reasons, open/approved/rejected state, timestamps, and reviewer note. A real implementation should also record reviewer identity or system actor and immutable before/after patches.

## Migration files

- `db/schema.ts` is the typed source of truth.
- `drizzle.config.ts` targets SQLite and writes to `drizzle/`.
- `drizzle/0000_mighty_tony_stark.sql` creates the five tables and indexes.
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

1. Provision a development database only.
2. Apply migrations and verify bindings in local and preview environments.
3. Add repository tests with isolated data.
4. Persist one adapter’s runs and review items without changing the public UI.
5. Add an admin-only review path with authentication and audit logging.
6. Add a server read path and compare its output against the static catalog.
7. Switch the public page behind a feature flag.
8. Keep the seed fallback until rollback has been exercised.

## Data integrity rules

- Source plus external ID is the ingestion identity.
- Published records require canonical source, valid coordinates, and review-approved status.
- Source facts and AI editorial proposals should be separable in audit history.
- Expiry should change visibility/status, not destroy provenance.
- Run writes and mission/review writes should be transactional when possible.
- Never expose a D1 or database binding to browser code.

## Object storage

R2 is currently disabled. Do not mirror remote images into storage without checking license and organizer terms. If object storage is introduced for permitted media, preserve original source, license, credit, checksum, fetch time, transforms, and deletion policy.
