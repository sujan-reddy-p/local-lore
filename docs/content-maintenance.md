# Content maintenance

This is the authoritative guide for the manually invoked OMP catalog-maintenance skill. `AGENTS.md` defines repository-wide invariants; `docs/source-and-image-policy.md` defines access, rights, and provenance; `.claude/skills/local-discovery/SKILL.md` contains the operational research contract.

## Manual workflow

The catalog is `data/source-catalog.json`; the offline validator is `npm run catalog:validate`. Invoke from the repository root with the skill file included:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md and perform a bounded manual catalog maintenance run."
```

No JavaScript researcher/publisher, cron, timer, LaunchAgent, installed schedule, automatic commit/push, or human approval gate is active. User controls invocation and Git publication. Ephemeral code under ignored `outputs/` may normalize large JSON batches; it is not an installed pipeline or package command.

## Research contract

Maintain the full configured inventory in bounded local OMP loops, with explicit batches of five named venues, literal names/coordinates, and distinct output filenames. Leaf agents return evidence and outcomes; parent deduplicates against the whole catalog and normalizes typed records. Failures preserve good records; unvisited sources are not failed reads. Expire scheduled occurrences separately; retirement requires explicit sourced cancellation, permanent closure, or rights withdrawal.

Research and expansion are resumed. Target 100 distinct worthwhile things per major city, not 100 upcoming events; quality and breadth precede quotas. Complete data/source quality before the final UI/design pass; road trips are deferred. Cover neighborhoods, South San Francisco, Pacifica, Half Moon Bay, coast and countryside within configured bounds and 75 km. Count against `data/coverage-boundaries.geojson`; report place/activity, program, and upcoming-event counts separately. Discovery state records current coverage, leads, blockers, and gaps.

Prefer primary official organizer/event sources, then suitable venue sources. Respect access terms, rate limits, robots/authentication controls, image rights, and security. Public visibility and model confidence do not grant permission. Never invent facts or claim a `curated-seed` is verified live.

Every missing-image item triggers event, venue, then logo research and a private download to ignored `outputs/image-review/`, outside `public/`. During this data-first round, stage new candidates without chasing permission or publishing them. Record source/credit/hash and decoded-file evidence in `pendingImages`; unknown rights remain unknown. Retain existing website imagery or owned artwork. This is not a general human content gate.

Venue identity/address may be matched to actual geographic data even if source page omits coordinates. Never copy sibling coordinates or use city center. Named POIs are leads, not proof of visitor access/live operation. Prefer source Polygon/MultiPolygon with holes, string `map.evidence`, and `sourceUrl`; then a legitimate matching native outline. Every mission retains a 25–100 m ground locator circle fallback, not a footprint. Routes are start-first; lines only on focus for exact source course geometry or typed `connection` with exactly two geocoded actual endpoints; connections dashed/directed. Never treat area as course.

Use canonical scheduled kind and `startsAt`/`endsAt`, not dated/start/end. Date-only end is inclusive through Bay Area calendar day; timestamps expire at the exact instant. Evergreen and ongoing recurring listings have no TTL.

## Validate, review, publish

Run catalog validation and review intended changes. Report only work and outcomes actually observed. Do not report research complete while coverage is short or unvisited sources remain. Commit/push only when explicitly requested. Historical Postgres approval/review schema remains inactive infrastructure, not a publication gate.
