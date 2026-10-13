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

The 100-evergreen-per-major-city goal remains secondary to complete, distinctive experiences. Expansion is paused pending the user's design-quality review. Use the experience breadth matrix and complete-candidate gate in the skill; cover neighborhoods, South San Francisco, Pacifica, Half Moon Bay, the coast and countryside as well as incorporated cities. Apply configured bounds and the 75 km cutoff; derive city counts from `data/coverage-boundaries.geojson`. `data/discovery-state.json` holds current coverage, incomplete leads, blockers, and regional gaps; never quote stale intermediate totals.

Prefer primary official organizer/event sources, then suitable venue sources. Respect access terms, rate limits, robots/authentication controls, image rights, and security. Public visibility and model confidence do not grant permission. Never invent facts or claim a `curated-seed` is verified live.

Every missing-image item triggers event, venue, then logo research. Authorized images may be published with complete credit/alt/source/license metadata. When permission is unclear, download the most suitable public candidate into ignored `outputs/image-review/`, outside `public/`, and record an `awaiting-image-review` manifest in discovery state's `pendingImages`. Do not publish or publicly commit the staged binary until user review; retain current authorized imagery or owned artwork meanwhile. Do not treat this image-specific review as a general human content gate.

Venue identity/address may be matched to actual geographic data even if source page omits coordinates. Never copy sibling coordinates or use city center. Named POIs are leads, not proof of visitor access/live operation. Prefer source Polygon/MultiPolygon with holes, string `map.evidence`, and `sourceUrl`; then a legitimate matching native outline. Every mission retains a 25–100 m ground locator circle fallback, not a footprint. Routes are start-first; lines only on focus for exact source course geometry or typed `connection` with exactly two geocoded actual endpoints; connections dashed/directed. Never treat area as course.

Use canonical scheduled kind and `startsAt`/`endsAt`, not dated/start/end. Date-only end is inclusive through Bay Area calendar day; timestamps expire at the exact instant. Evergreen and ongoing recurring listings have no TTL.

## Validate, review, publish

Run catalog validation and review intended changes. Report only work and outcomes actually observed. Do not report research complete while coverage is short or unvisited sources remain. Commit/push only when explicitly requested. Historical Postgres approval/review schema remains inactive infrastructure, not a publication gate.
