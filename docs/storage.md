# Storage architecture

## Decision

The active catalog and discovery state are versioned in Git. The website bundles `data/source-catalog.json` through `lib/seed-data.ts`; it does not query Postgres for catalog or event data. PostgreSQL/Neon schemas, migrations, source observations, event candidates, decisions, and revisions are historical operational infrastructure, not the active catalog publication path. The optional visitor route is separate. Credentials must never enter source control or browser code.

## Connect a fresh local checkout

The historical Neon project can be linked for database maintenance, but this setup is not required for catalog publication. Use the ignored `.env.local` for credentials:

```bash
npx neon@latest link --project-id spring-sun-40275315 --branch main --no-env-pull -y
npx neon@latest env pull --service postgres --file .env.local
npm run db:setup
```

If the Neon CLI needs authorization, run `npx neon@latest auth` and complete browser sign-in. If the shell's `CI` variable prevents browser sign-in, use `env -u CI npx neon@latest auth`. Never print or commit `.env.local` values.


## Current state

The static catalog is maintained through the manually invoked OMP workflow described in `docs/content-maintenance.md`. Existing visible records retain `approved_for_display` as historical lineage, not automated-fetch or image-reuse permission.

The removed catalog importer and former publication workflow are historical setup facts, not current publication contracts. The deployed page reads the Git catalog, not mission/event rows in Postgres. Historical backend ingestion and review paths remain inactive.

## Historical backend tables

### `sources`

Stable identity, source/display lineage, canonical and terms URLs, explicit automated-fetch/image permissions, timezone, enabled state, refresh cadence, and fetch validators.

### `missions`

Editorial catalog entries, including category, location, image, schedule, source references, stable catalog order, and lifecycle.

### `event_occurrences`

One dated event instance per source identity, with source URL, title, timezone-aware start/end, location evidence, price, source snapshot/provenance, confidence, lifecycle, and expiry. Separate from evergreen missions.

### `ingestion_runs`, `source_observations`, `candidate_decisions`

Run counts/outcome, response validators/content hash, extracted structured events, and retained normalized candidates with rejection/review reasons.

### `event_reviews`, `event_revisions`, `mission_revisions`

Human approval/rejection/update audit records and before/after event/catalog state. Event decisions are transactionally coupled to publication.

## Migrations and historical import

- `db/schema.ts` is the typed Drizzle schema; `drizzle/postgres/` is its migration history.
- `npm run db:generate` generates a migration; review the SQL before applying it.
- `npm run db:migrate` applies pending PostgreSQL migrations, preferring `DATABASE_URL_UNPOOLED` for direct Neon connections, then `DATABASE_URL` or `POSTGRES_URL`.
- `npm run db:setup` applies PostgreSQL migrations for optional visitor storage. It requires configured credentials, does not fetch sources, and does not synchronize the Git catalog.

Historical catalog upserts update catalog-owned fields for matching stable IDs, preserve unrelated database rows, and do not delete records.

## Historical backend data model

### `sources`

Stable identity, source/display lineage, canonical and terms URLs, explicit automated-fetch/image permissions, timezone, enabled state, refresh cadence, and fetch validators.

### `missions`

Editorial catalog entries, including category, location, image, schedule, source references, stable catalog order, and lifecycle.

### `event_occurrences`

One dated event instance per source identity, with source URL, title, timezone-aware start/end, location evidence, price, source snapshot/provenance, confidence, lifecycle, and expiry. Separate from evergreen missions.

### `ingestion_runs`, `source_observations`, `candidate_decisions`

Run counts/outcome, response validators/content hash, extracted structured events, and retained normalized candidates with rejection/review reasons.

### `event_reviews`, `event_revisions`, `mission_revisions`

Historical human approval/rejection/update audit records and before/after event/catalog state. This manual publication path is inactive.
## Data integrity

- Keep source permission distinct from display lineage, factual confidence, and image reuse.
- Preserve source observations and rejected candidates where the historical backend is maintained; do not erase provenance.
- Never publish unknown freshness as verified.
- A failed fetch is not a successful refresh and does not mass-expire records.
- Expire occurrences by lifecycle state; keep their history.
- Keep the static catalog as runtime source unless database-backed reads are explicitly activated with corresponding architecture, policy, observability, and rollback updates.

## Object storage

R2 is disabled. Do not mirror or transform remote images without checking permission, credit, source URL, checksum, fetch time, and deletion policy.
