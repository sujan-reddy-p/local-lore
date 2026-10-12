# Source-owned catalog data

`source-catalog.json` is the website’s versioned source registry and catalog. Records stay nested under their source; counts are computed from the current snapshot, not fixed constants.

Existing curated entries retain `approved_for_display` as historical lineage. It is not an independent live fact-check, automated-fetch permission, or permission to reuse images. Newly researched records carry their own check date, source status, and evidence.

The local agentic publisher assesses permitted source access without a human approval gate. It reads public primary sources, verifies actual-read quotations and geographic evidence, and publishes only supported processed catalog/state changes. Failed fetches preserve records; expired scheduled occurrences and explicitly sourced permanent closures/cancellations are handled separately. Unknown price/duration remain null. Evergreen activities must not be overwritten by dated occurrences.

Keep stable IDs, global `catalogOrder`, source links, provenance, and rights-verified image metadata. `lib/seed-data.ts` adapts this JSON to the UI; never edit that adapter to add website content. Run `npm run catalog:validate` after content changes. The website does not import its catalog into Postgres; `db:setup` only applies migrations for optional visitor storage.

`discovery-config.json` owns the SF anchor, 75 km cutoff, shared regional bounds, coverage goals, research limits, and local schedule. `discovery-state.json` stores the published rotation/check state. Raw research and operational logs remain ignored under `outputs/`, not in Git.

See `docs/content-maintenance.md`, `docs/local-agent-automation.md`, and `.claude/skills/local-discovery/SKILL.md` for add/update/remove commands and the researcher’s complete contract.
