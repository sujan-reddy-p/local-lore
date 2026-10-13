# Local catalog maintenance

## System boundary

The website bundles `data/source-catalog.json` through `lib/seed-data.ts`; catalog maintenance is a manually invoked OMP GPT-6 Luna skill. PostgreSQL ingestion, observations, candidates, decisions, and revisions remain historical infrastructure; they are not the active catalog publication path. PostHog remains browser analytics only.

## Manual procedure

From the repository root, include the complete skill file in the invocation:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md and perform a bounded manual catalog maintenance run."
```

There is no JavaScript researcher/publisher, installed schedule, timer, cron, LaunchAgent, automatic commit/push, or human approval gate. User decides invocation and Git publication. Ephemeral processing code under ignored `outputs/` may normalize large JSON; it is not an installed pipeline/package command. Explicit five-venue batches use literal names/coordinates and distinct output filenames; parent deduplicates full catalog and normalizes typed records. Failed reads do not close sources; unvisited are not failed.

## Source and catalog rules

- Preserve good records on failed fetch or “not seen”; expire scheduled occurrences separately; retire only on explicit sourced cancellation, permanent closure, or rights withdrawal.
- Deduplicate experiences, venues, and occurrence times against the full catalog.
- Coverage goal: at least 100 distinct evergreen experiences per configured major city, plus supported dated events; no quota padding or duplicate experiences. Expansion is paused until the user reviews design quality. `data/discovery-state.json` records actual Census-boundary coverage, coastal gaps, incomplete leads, and the Luna usage-limit blocker. Recompute counts rather than copying a historical snapshot.
- Preserve source URL/name/check date, seed/live status, accessibility, price, canonical schedule, stable IDs/order, and provenance. Unknown facts remain unknown.
- Source terms, access controls, rate limits, security, attribution, image rights, and no-invention rules remain mandatory.
- Every discovery and refresh checks missing images: event photo, suitable venue photo, then logo. Download the best publicly accessible candidate to ignored `outputs/image-review/<id>/`, outside `public/`, and record provenance in `pendingImages`. Unclear rights do not prohibit local staging, but the candidate must not appear on the website before user review. Preserve licensed current photos; missing/failed photos use owned subject artwork. Follow the authoritative skill for bounded downloads and manifest fields.
- Venue identity/address may be matched against actual geodata; coordinate prose is unnecessary. Never copy sibling coordinates or city center. Named POI leads do not prove visitor access/live operation.
- Prefer source Polygon/MultiPolygon with holes, string `map.evidence`, and source URL, then legitimate matching native outline. Every mission retains a 25–100 m ground locator circle, never a physical footprint. Routes start-first; exact sourced course or typed connection with exactly two geocoded actual endpoints only; connection is dashed/directed and focused. Never use area as course.
- Canonical scheduled kind uses `startsAt`/`endsAt`. Date-only end is inclusive Bay Area day; timestamp expires at its instant. Evergreen and ongoing recurring have no TTL.

## Review and publication

Run catalog validation and inspect intended changes. Report counts from current JSON and actual city boundaries, plus failures and unresolved work. Commit/push only when explicitly requested; never commit raw source pages, secrets, or staged unclear-rights images. Consult `.claude/skills/local-discovery/SKILL.md` before every discovery or refresh.
