# Content maintenance

This is the authoritative guide for the active catalog maintenance path. It covers research, deterministic publication, and bounded Git snapshots. `AGENTS.md` defines repository-wide invariants; `docs/source-and-image-policy.md` defines access, rights, and provenance rules; this guide defines the content procedure.

## Active path and exact files

- Runner: `scripts/discover-catalog.mjs`.
- Research profile: `.omp/agents/local-discovery.md`; skill contract: `.claude/skills/local-discovery/SKILL.md`.
- Runtime config and carried state: `data/discovery-config.json` and `data/discovery-state.json`.
- Proposal output: a strict JSON file supplied with `--output`; stage with `--proposal`.
- Source-grouped catalog: `data/source-catalog.json`.
- Publisher implementation: `lib/discovery/publisher.mjs`; proposal schema/validator: `lib/discovery/schema.mjs`.
- Publish-boundary types: `lib/types.ts` (contract owner; do not edit as part of routine content runs).
- Deterministic projection: `lib/seed-data.ts` (never hand-edit for content).
- Shared geography: `lib/region.ts` (SF anchor and bounds).
- Source evidence ledger: `data/source-audit-reports.jsonl` when a run records an audit result.
- Rights and access policy: `docs/source-and-image-policy.md`.

Use `node scripts/discover-catalog.mjs research --output outputs/proposal.json [--model <model>]`, `node scripts/discover-catalog.mjs stage --proposal outputs/proposal.json`, and `node scripts/discover-catalog.mjs apply --proposal outputs/proposal.json --catalog outputs/isolated-catalog.json --state outputs/isolated-state.json --output outputs/alternate-catalog.json`. Copy the bundled catalog/state to the isolated input paths before isolated apply. Package aliases are `catalog:research`, `catalog:stage`, and `catalog:apply`. For `apply`, `--output` is an alternate catalog destination, not a report; for `research`, it is the local proposal file. Research requires an installed `omp` and local OMP credentials; the default model is `openai-codex/gpt-6-luna`, overridable with `LOCAL_DISCOVERY_MODEL` or `--model`. Credential-unavailable runs must fail honestly.

Research and processing occur only on the maintainer’s local Mac. Raw proposals, run logs, source pages, and generated outputs stay ignored locally; only processed catalog/state files may enter Git. No raw source pages or secrets are committed.

The daily wrapper is `scripts/daily-discovery.mjs` (`npm run catalog:daily`); launchd is managed by `scripts/schedule-discovery.mjs install|remove|status` (`npm run catalog:schedule -- ...`), with default local time `08:17` from `data/discovery-config.json` fields `schedule.hour` and `schedule.minute`. The wrapper prepares an isolated copy, refuses a dirty repository or branch that differs from `origin`, validates and builds/tests before copying back only the allowed catalog/state files, then commits and pushes those two files. Raw research remains local-only.

## Research contract

Research official organizer, venue, institution, agency, or authorized public-feed evidence first. Preserve canonical URL, source identity, access conditions, terms/robots/feed documentation, attribution, rate limits, check time, and image-rights basis. Never bypass controls. Never invent price, duration, date, time, coordinates, accessibility, availability, route geometry, organizer identity, or image rights. Use `price: null` when unlisted and `duration: null` when unknown; the UI renders these as “Not listed” and “Time varies” and numeric filters do not match them.

Use the San Francisco anchor `[-122.42, 37.78]` and a 75 km geodesic cutoff. Seek a richer catalog of 350–500 distinct regional activities, 25–40 per major city, and 8–15 per small town/activity hub, plus scheduled events in a rolling 30-day window. These are coverage signals, never quotas: skip incomplete or unsupported findings rather than fabricate records. Retain gaps and source state for the next run.

For map context, set `map.kind` only when supported: `area`, `venue`, or `route`. A route `map.route` is permitted only for genuine source-backed course geometry and may include `sourceUrl`; without it, publish the start marker only. Do not infer park/building polygons for running, cycling, or route activities.

## Add and update

1. Read the current source group and record before changing it; preserve `catalogOrder`, stable IDs, existing images, and source provenance.
2. For an add, require a canonical source URL, source-backed factual fields, coordinates inside the shared region, original Local Lore framing, and complete rights metadata or no image. Group the record under its owning source.
3. For an update, change only fields supported by new evidence. Preserve unchanged fields and record the new check/source evidence. Deduplicate real experiences, venue identities, and event times rather than creating near-duplicates.
4. For a scheduled event, retain source timezone and genuine date/time. Expire past occurrences separately. A failed fetch or “not seen” result preserves the last good record and is not cancellation evidence.
5. Validate the complete catalog and inspect the diff. Do not hand-edit `lib/seed-data.ts` or create a second catalog.

## Remove and retire

Remove only an erroneous duplicate or a record with no defensible source-backed identity, while preserving provenance in the run output. Retire an activity or occurrence only with explicit sourced cancellation, closure, or rights withdrawal. Marking “not seen”, a failed fetch, a timeout, or a transient source error is not retirement. Keep past occurrences and their evidence separate from active results.

## Validate, publish, and revert

The publisher MUST reject malformed structured output, invented or unsupported facts, out-of-region coordinates, missing provenance, rights violations, duplicate identities/times, and edits outside the catalog/state paths allowed for a content run. It MUST preserve good records on failed fetches, write no secrets, and refuse code/config/package changes.

After deterministic checks pass, create one bounded Git snapshot containing only the intended catalog/state/rights-verified media changes. Publish by the configured Git workflow; do not claim a run completed unless its command output says so. To revert, restore the prior known-good Git snapshot (or use `git revert` on the bounded publication commit), rerun deterministic validation, and preserve the failed-run evidence. Human correction/takedown and public submissions are not implemented now; if a later path is added, update this guide and the source policy together.

## Routine run checklist

- Read due sources and coverage gaps; retain state from prior runs.
- Research evidence and emit strict structured findings.
- Validate geography, contracts, null semantics, schedule/date, source access, rights, duplicates, and provenance.
- Apply only add/update/remove/retire changes supported by evidence.
- Validate the catalog and review the bounded diff.
- Publish the Git snapshot or report honestly why publication was skipped.
- Record failed fetches, “not seen”, expiries, explicit retirements, and unresolved coverage gaps for the next run.
