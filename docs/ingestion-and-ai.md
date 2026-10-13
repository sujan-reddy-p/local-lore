# Source ingestion and AI curation

## Current state

The page bundles `data/source-catalog.json` through `lib/seed-data.ts`; catalog research and direct supported edits are performed only through the manually invoked OMP skill. PostgreSQL ingestion, candidates, reviews, and revisions are historical inactive infrastructure and are not part of static catalog publication.

Existing `reviewStatus` labels preserve lineage/eligibility; they are not a mandatory human approval gate. Source access controls, terms, rights, security, provenance, and no-invention rules remain required. Failed reads and “not seen” preserve good records. Expire dated occurrences separately from evergreen activities; retire only on explicit sourced cancellations, permanent closures, or rights withdrawals.

## Manual catalog maintenance

Invoke with the skill file included, from the repository root:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md and perform a bounded manual catalog maintenance run."
```

The complete inventory, bounded parallel-worker assignments, checked/failed/unchanged outcomes, geography, evidence, and image/geometry policy are defined by `.claude/skills/local-discovery/SKILL.md` and `docs/content-maintenance.md`. There is no JavaScript researcher/publisher or automatic schedule/Git operation. The user decides invocation and publication. Validate locally with `npm run catalog:validate`.

## Historical backend

`lib/ingestion/`, source adapters, PostgreSQL migrations, candidate staging, and review commands remain historical backend infrastructure. Do not route new static catalog content through them or remove their schemas/migration history as part of this frontend/catalog workflow change. Database credentials remain server/local-only.
