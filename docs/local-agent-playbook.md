# Local catalog agent playbook

## Ownership

- `data/source-catalog.json`: complete source-grouped catalog; counts describe the checked-in snapshot.
- `data/discovery-config.json`: full city/source inventory, Bay Area bounds, 75 km radius, and richness goals.
- `data/discovery-state.json`: manually recorded source checks and outcomes; no automatic rotation or schedule.
- `.claude/skills/local-discovery/SKILL.md`: authoritative operational instructions for manual OMP maintenance.
- `lib/seed-data.ts`: deterministic catalog adapter; do not hand-edit for content.
- `lib/types.ts`, map geometry/media, and application code: parent-owned, outside routine catalog edits.
- PostgreSQL schemas, migrations, and `lib/ingestion/`: historical backend ingestion/review; not the active catalog publication path.

## Invocation

From repository root, explicitly invoke OMP with the skill file included:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md and perform a bounded manual catalog maintenance run."
```

No JavaScript publication workflow, installed schedule/timer/cron/LaunchAgent, automatic commit/push, or human approval gate exists. User controls invocation and Git publication. Research full configured inventory using bounded workers. Explicit five-venue leaf batches use literal names/coordinates and distinct output filenames; parent deduplicates against the full catalog and normalizes typed records. Ephemeral code under ignored `outputs/` may normalize large JSON but is not an installed pipeline or package command. Record checked, failed, unchanged outcomes; failed reads do not close sources, and unvisited is not failed.

## Research rules

Apply both the 75 km geodesic radius and shared region bounds. GPT-6 Luna research is authorized, but eleven latest workers returned `usage_limit_reached` again after the earlier reset. Preserve partial evidence and pending assignments; do not silently change models. Complete data/source quality before the final UI/performance pass. Target 100 worthwhile things per major city, not 100 upcoming events; report places/activities, ongoing programs, and upcoming events separately without padding. Consult `data/discovery-state.json` for actual boundary coverage, coastal gaps, source outcomes, and held leads.

Venue identity/address may be matched to actual geographic data; source coordinates need not be printed. Never copy sibling coordinates or city center. Named POIs are leads, not proof of visitor access/live operation. Failed reads and “not seen” preserve records; expire scheduled occurrences separately; retirement needs explicit sourced evidence. Preserve source identity, URLs/check dates, seed/live status, accessibility, price, canonical schedule, IDs/order, and provenance.

Use primary evidence; honor terms, access controls, rate limits, and security. Every discovery and refresh researches missing images in event-photo, suitable venue-photo, then logo order. Download the best publicly accessible candidate privately to ignored `outputs/image-review/<id>/`, outside `public/`, even when reuse permission is unclear. Record the full provenance manifest in `pendingImages`; do not publish unclear-rights images before user review or invent permission. Preserve licensed photos. The authoritative skill specifies bounded downloads and publication rules.

Prefer source Polygon/MultiPolygon with holes, string `map.evidence`, and `sourceUrl`; then legitimate matching native outline. Every mission retains 25–100 m ground locator circle fallback, never physical footprint. Routes start-first, never area-as-course; only exact sourced course or typed connection with exactly two geocoded actual endpoints renders on focus. Connections dashed/directed.

Canonical schedule kind is `scheduled`, with `startsAt`/`endsAt`. Date-only end is inclusive through Bay Area calendar day; timestamps expire at exact instant. Evergreen and ongoing recurring have no TTL.

## Validation and publishing

Run the offline validator and inspect intended changes. Report current JSON-derived counts only, failures, and unresolved coverage; research is not complete while shortfalls/unvisited sources remain. Historical approval labels/schema are lineage, not an active human gate. Publish only when explicitly requested.
