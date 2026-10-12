# Source ingestion and AI curation

## Current state

The page bundles `data/source-catalog.json` through `lib/seed-data.ts`; it does not query Postgres for catalog or event occurrences. The active path is the agentic Git catalog publisher: evidence-bearing research emits strict structured findings, then deterministic validation writes a bounded snapshot. Existing database candidates, reviews, and revisions are historical inactive infrastructure.

Source and record `reviewStatus` labels preserve lineage/eligibility evidence, not a mandatory human publication gate. Source access controls, terms, rights, security, provenance, and no-invention rules remain required. Failed fetches and “not seen” results preserve good records.

The publisher supports source-backed evergreen activities and genuine dated occurrences. Expiry is separate from explicit sourced cancellation/closure; duplicate real experiences, venues, and event times are collapsed.

## Pipeline

```text
select due source or coverage gap
→ agent researcher reads permitted evidence and emits strict structured findings
→ deterministic normalization and validation of facts, geography, rights, duplicates, and dates
→ apply source-backed add/update/remove/retire changes to the Git catalog
→ bounded snapshot publication; preserve evidence and revert by prior snapshot
```

Source permission, display lineage, factual confidence, image reuse, and publication are separate concerns. Agentic publication removes the mandatory human review step, not access controls or evidence requirements.


## Versioned catalog boundary

`data/source-catalog.json` groups source definitions and their existing catalog records. `lib/seed-data.ts` adapts those records to the current `LoreItem` page contract. Existing records carry `approved_for_display` based on the maintainer’s accuracy assumption; the source’s `allowsAutomatedFetch` and `enabled` fields still control whether a fetch may run. Image rights remain separate.

A Local Lore mission/place is not a dated event occurrence. `event_occurrences` stores event identity, original event URL, source timezone, start/end instants, place evidence, source snapshot, lifecycle, and expiry separately from `missions.schedule`.

## Source permissions and supported inputs

Before automated fetching, document the permitted canonical source, exact access method, relevant terms, attribution, rate limits, and refresh boundaries. A source URL or public visibility is not permission. Do not bypass authentication, CAPTCHAs, bot protection, paywalls, rate limits, or technical controls.

The generic collector recognizes `text/calendar` and HTML containing JSON-LD Event records. Parser support is not permission; source-specific access conditions and evidence still apply. Do not let AI crawl for missing instructions.

## Deterministic normalization and historical review model

Normalization preserves source identity, canonical event URL, source snapshot hash, observation time, source timezone, and original structured data. Local timezone wall-times convert to UTC only when unambiguous; nonexistent and ambiguous daylight-saving times are rejected. Non-HTTPS links and malformed/incomplete timestamps are rejected rather than guessed. Agents must not invent date/time, price, availability, address, coordinates, accessibility, organizer identity, canonical URL, or image rights.

AI confidence is a triage hint, never source evidence. The deterministic publisher applies only supported facts and records provenance. The former database candidate-review CLI and human approval flow are historical and inactive.

## Schedule, freshness, and expiry

Refresh cadence uses source `refreshHours` only after the source is explicitly enabled. Failed fetches use bounded backoff; they do not count as successful freshness. Persist and distinguish:

- last attempted check, HTTP outcome, and failure;
- source content hash and HTTP validators;
- next eligible check;
- event start/end and source timezone;
- expiry and last-seen state.

A failed fetch is not a successful refresh and must not mass-expire records. A missing event in one snapshot is not evidence of cancellation. Expired occurrences leave active results but retain provenance and history.

The current browser schedule logic remains a display convenience for evergreen missions, not evidence of a live schedule. Dynamic event times require timezone-aware occurrence facts.

## Active runner and historical backend commands

Use `node scripts/discover-catalog.mjs research|stage|apply` or the `catalog:research`, `catalog:stage`, and `catalog:apply` package scripts as documented in `docs/content-maintenance.md`. The local researcher emits strict proposals; deterministic staging/application checks and applies only evidence-backed Git catalog changes. `scripts/daily-discovery.mjs` provides isolated research and bounded catalog/state publication. Historical database refresh and event-review commands are inactive and are not required for catalog publication; their former package aliases have been removed.
