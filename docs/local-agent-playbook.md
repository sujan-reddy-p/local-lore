# Local catalog agent playbook

## Role and active publication path

The local agent maintains the versioned catalog and source knowledge in Git. An evidence-bearing researcher produces strict structured findings; a deterministic validator/publisher applies only source-backed changes and creates a bounded Git snapshot. No mandatory human approval or review queue is part of this path. Access controls, rights, security, provenance, and “never invent” rules remain mandatory.

## Current data layout

- `data/source-catalog.json`: source-grouped catalog. Record/source counts describe the checked-in snapshot, not an invariant for future data.
- `data/discovery-state.json`: publisher rotation and source-observation state.
- Raw proposals, research evidence, and run outputs are local-only ignored files; never commit them.
- `lib/seed-data.ts`: deterministic projection of the catalog into the `LoreItem` UI contract. Do not edit it to change content.
- `scripts/discover-catalog.mjs`: active researcher, strict proposal staging, and deterministic apply flow.
- `scripts/daily-discovery.mjs`, `scripts/schedule-discovery.mjs`: isolated daily publisher and local macOS launchd management.
- PostgreSQL schemas, migrations, and `lib/ingestion/`: historical backend candidate/manual-review implementation; not required for catalog publication.
- `docs/source-and-image-policy.md`: source access and image rights requirements.
- `docs/catalog-and-data-model.md`: field meanings, lineage states, and QA rules.

Existing catalog records retain historical `approved_for_display` lineage. This is not an independent accuracy audit or permission to fetch sources or reuse images. A source check date is not proof of live status.

## Research and source checks

The active local agentic publisher selects research opportunities, reads permitted public evidence through OMP, and emits strict structured findings. Defaults to `openai-codex/gpt-6-luna`; override with `--model` or `LOCAL_DISCOVERY_MODEL`. Keep raw research proposals, source pages, logs, and generated outputs local-only and ignored. Do not copy these into Git.

1. Research official organizer, venue, agency, institution, or authorized public-feed evidence; retain canonical URL, source identity, applicable access terms, attribution, rate limits, check time, and image-rights basis.
2. Record only explicit source-backed facts. Never invent date, time, price, coordinates, accessibility, availability, route geometry, organizer identity, or image rights.
3. Separate evergreen activities, recurring programs, and genuine dated occurrences. A failed fetch or “not seen” result preserves existing good records and does not imply cancellation.
4. Apply the San Francisco anchor and 75 km geodesic cutoff. Research coverage goals guide work but are not quotas; skip unsupported or incomplete findings.
5. Stage and apply through `scripts/discover-catalog.mjs`; use `docs/content-maintenance.md` for add/update/remove/retire decisions, validation, publication, and revert.

Source access permission, terms, rate limits, legal restrictions, rights, security, provenance, and no-invention rules remain mandatory. Public visibility, model confidence, or a historical lineage label is not permission.


## Historical database boundary

Neon/Postgres schemas, migrations, candidate decisions, and manual review implementation remain historical operational infrastructure. Database setup/import records previous synchronization state; current 212-record count is not a fixed-data contract for future snapshots. The active publisher writes validated, source-backed Git snapshots and does not require database setup or human candidate approval. Never expose credentials to browser code.

## Checks and publishing

```bash
npm run catalog:validate
npm run catalog:research -- --output proposal.json
npm run catalog:stage -- --proposal proposal.json
npm run catalog:apply -- --proposal proposal.json
npm run lint
npx tsc --noEmit --incremental false
npm test
```

For routine automated publication use `npm run catalog:daily`; the local schedule is managed by `npm run catalog:schedule -- install|remove|status`. See `docs/content-maintenance.md` for prerequisites and bounded publication behavior. Removed `sources:refresh`, `sources:audit`, and `events:review` package aliases are not valid commands. The local dev preview at `http://localhost:4317` hot-reloads UI changes.
