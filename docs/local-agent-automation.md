# Local agent automation runbook

## System boundary

| System | Holds | Writer |
|---|---|---|
| GitHub repository | `data/source-catalog.json`, `data/discovery-state.json`, source policy, code, docs, and image assets | Active local agentic publisher creates bounded catalog/state snapshots |
| PostgreSQL | Historical source observations, ingestion runs, event candidates, decisions, revisions; optional visitor records | Historical local CLI/server-only app |
| PostHog | Browser analytics and session replay | Browser SDK only |

PostHog is analytics, not the Local Lore catalog database. Do not store organizer or mission facts there.

## Current activity

The website bundles its catalog from `data/source-catalog.json` through `lib/seed-data.ts`; it does not query Postgres for catalog or event data. The active publication path is an agentic researcher plus deterministic validator/publisher that writes a bounded Git snapshot. Existing Neon/Postgres migrations, observations, candidates, decisions, and revisions remain historical operational infrastructure.

Source and record review labels preserve lineage and eligibility evidence; they are not a mandatory human approval gate. Access controls, rights, security, provenance, and source terms remain mandatory. Human correction/takedown workflows are not implemented now.

The runner must retain good records on failed fetches or “not seen”, expire past occurrences separately, retire only explicit sourced cancellations/closures, deduplicate genuine experiences/venues/times, and never invent facts.

## Active publication flow

```text
local Mac: node scripts/daily-discovery.mjs [--limit N] [--model MODEL]
→ isolated Git worktree and local OMP research/processing
→ deterministic validation and build/tests
→ copy only processed catalog/state into the clean checkout
→ commit and push only `data/source-catalog.json` and `data/discovery-state.json`
```

Manual runner commands:

```text
node scripts/discover-catalog.mjs research --output proposal.json [--model MODEL]
node scripts/discover-catalog.mjs stage --proposal proposal.json
node scripts/discover-catalog.mjs apply --proposal proposal.json --catalog isolated-catalog.json --state isolated-state.json --output alternate-catalog.json
```

For `apply`, `--output` is an alternate catalog destination, not a report. For `research`, it is the local proposal file. Package aliases are `catalog:research`, `catalog:stage`, `catalog:apply`, and `catalog:daily`. OMP credentials stay local; the default model is `openai-codex/gpt-6-luna`, overridable by `LOCAL_DISCOVERY_MODEL` or `--model`. Raw proposals, source pages, logs, and generated research outputs are local-only and ignored; never commit them. Source access permission, terms, rate limits, image rights, security, evidence, provenance, and no-invention requirements remain mandatory.

`scripts/schedule-discovery.mjs install|remove|status` manages macOS launchd at the configured local time (default `08:17`) from `data/discovery-config.json` fields `schedule.hour` and `schedule.minute`. Install only from a durable checkout, not `/tmp`; the daily wrapper refuses a dirty checkout or branch that differs from `origin`. A failed push leaves the local bounded commit in place for deliberate synchronization.

## Source and catalog rules

- Source/record status is lineage and eligibility evidence; it is not a mandatory publication approval.
- Automated fetching still requires documented permitted access, terms, rate limits, and rights. Source registry presence or public visibility is not permission.
- Do not bypass robots, authentication, CAPTCHA, paywalls, rate limits, or anti-bot controls.
- Preserve existing records and `catalogOrder` unless evidence-backed maintenance changes them; current record counts are snapshot state, not a permanent contract.
- `lib/seed-data.ts` is an adapter only; do not hand-edit it to change content.
- Coordinates are `[longitude, latitude]`; map bounds live in `lib/region.ts`.
- Keep editorial framing distinct from sourced event facts.

## Operator commands

```bash
npm run catalog:validate
npm run catalog:research -- --output proposal.json
npm run catalog:stage -- --proposal proposal.json
npm run catalog:apply -- --proposal proposal.json
npm run lint
npx tsc --noEmit --incremental false
npm test
```

Historical `db:*` commands operate on PostgreSQL structures but are not publication steps. Removed package aliases `sources:refresh`, `sources:audit`, and `events:review` are not runnable commands. Database credentials remain server/local-only.

Inspect `http://localhost:4317` after UI or catalog changes. No UI changes are part of the data migration.


## Git publishing

The daily runner commits and pushes its two managed data paths after validation. For manual catalog publication, use the repository's configured Git workflow and inspect the bounded diff. Never commit `.env*`, `node_modules`, build output, credentials, raw proposals, source pages, or local scheduler logs.

## Run summary template

```text
Date:
Sources researched and evidence:
Access terms/rights retained:
Catalog IDs changed:
Validation result:
Bounded Git commit:
Notes:
```
