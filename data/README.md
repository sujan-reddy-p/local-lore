# Catalog data

`source-catalog.json` is the static source-grouped website catalog. Existing `approved_for_display` labels are historical lineage, not an independent current audit, fetch permission, or image-reuse permission.

`discovery-config.json` defines the manual full inventory, San Francisco anchor, 75 km radius, Bay Area bounds, and coverage goals. `discovery-state.json` is manually updated with observed source checks/outcomes; there is no automatic rotation, timer, or scheduler. Failed reads and “not seen” preserve existing records. Expire event occurrences separately and retire only on explicit sourced cancellation, permanent closure, or rights withdrawal.

`coverage-boundaries.geojson` contains source-backed Census city boundaries for coverage counting, not browser map assets. `pendingDiscoveryLeads` preserves incomplete discoveries outside the published catalog. `pendingImages` records privately downloaded candidates; binaries belong in ignored `outputs/image-review/`, never `public/` until reviewed. `pendingImageResearch` names missing-image work that has not yet been completed. Empty `pendingImages` means no staged download is claimed.

See `docs/content-maintenance.md`, `docs/local-agent-automation.md`, and `.claude/skills/local-discovery/SKILL.md` for manual maintenance and validation. The offline catalog validator remains `npm run catalog:validate`.
