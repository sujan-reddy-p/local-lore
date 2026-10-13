# Source and image policy

## Purpose

Local Lore earns trust by connecting people to original organizers while adding original editorial framing. Volume is valuable only when provenance, timing, location, and rights remain clear.

## Acceptable source priority

1. Official public API or documented public feed.
2. Government/agency open-data or official calendar.
3. Organizer, venue, institution, or community group calendar.
4. Organizer page used for manual curation.
5. Reputable secondary discovery source only as a lead; confirm against a primary source before publishing.

Search results, social reposts, unattributed aggregators, and copied calendars are not canonical sources.

## Access controls and manual research

Catalog maintenance is an explicitly invoked OMP skill, not an automated fetch or publication pipeline. Manual research must still honor published terms, robots/feed documentation, rate limits, authentication, legal restrictions, attribution, security, and source access controls. Public visibility, an accessible URL, or model confidence never grants permission. Never bypass authentication, CAPTCHA, bot protection, rate limits, paywalls, robots controls, or other technical restrictions.

The active publication flow is a user-invoked manual catalog edit followed by offline validation; Git commit/push occurs only when explicitly requested. Historical `approved_for_display` and `needs_source_review` labels remain lineage/eligibility state, not an independent fact audit or current human approval gate. Human correction/takedown workflows are future work; retain provenance for later correction.

## Content usage

- Store factual fields needed to help a visitor decide and reach the source.
- Write original Local Lore mission title, framing, and explanation.
- Do not republish full source descriptions, articles, or marketing copy.
- Use short factual names such as venue and organizer accurately.
- Link directly to the organizer’s actionable page.
- Keep attribution visible in mission details and map attribution.
- Honor corrections and removal requests promptly when a live system exists.

## Existing catalog versus live status

Existing visible records are retained under the maintainer’s historical accuracy assumption; this is not independent fact-checking and does not permit fetching or image reuse. `curated-seed` means an existing Local Lore record assembled from historical source evidence on its stored check date. It does not mean the activity is available now or that the source is currently approved for automated access. Never infer “live” merely from an accessible URL.

## Image rule

Website publication requires explicit license, public-domain status, existing owner confirmation, or supported permission. Downloading a publicly accessible image for local review is a separate operation and does not establish reuse rights.

On every discovery/refresh run, an item missing a suitable image must trigger event-image, venue-image, then logo research. Preserve direct original URL, proposed alt, known creator/owner credit (or explicitly unknown), original source page, and any license evidence. Prefer an existing authorized venue image over a new unclear-rights image.

If permission is unclear, download the best suitable publicly accessible candidate into ignored `outputs/image-review/<record-or-lead-id>/`, outside `public/`. Record its local path, source, MIME type, byte size, content hash, and `awaiting-image-review` status in discovery state's `pendingImages`. Do not publish it, commit the binary to a public repository, change the catalog image URL, set `allowsImageReuse: true`, or claim a license. User review applies only to this unclear-rights publication decision, not as a general human catalog gate.

The currently authorized image or UI-owned artwork remains on the website. A failed or inaccessible download remains a named incomplete task. Staged files are machine-local; a fresh checkout must reproduce the download from the manifest before claiming the asset is ready. The complete worker steps are in `.claude/skills/local-discovery/SKILL.md`.

Existing local primary images may remain displayed under the project owner’s confirmation. Metadata lives on each record’s `image` field in `data/source-catalog.json`; files are served from `public/images/missions/`. This does not grant automated fetching or reuse of new images. Recheck Commons source pages before public launch and remove image metadata if rights cannot be confirmed.

## Geography and map evidence

Apply both the 75 km geodesic radius from the San Francisco anchor and shared Bay Area bounds in `lib/region.ts`. Source-backed boundary GeoJSON belongs at `record.map.boundary`, with `kind` `area` or `venue`, `sourceUrl`, and concise evidence. Never infer a venue/activity boundary from basemap outlines. Route geometry must be actual source-backed ordered course geometry; without it, retain start-first point behavior. Preserve useful point halo fallback.

## AI and trust

The local OMP worker summarizes only source-backed facts. It cannot create provenance, permissions, licenses, dates, prices, coordinates, accessibility facts, or image rights. Record checked, failed, and unchanged outcomes; failed reads and “not seen” preserve known-good catalog records. Expire event occurrences separately and retire only with explicit sourced cancellation, permanent closure, or rights withdrawal.

## Takedown and correction design

Before accepting public submissions or live ingestion, add a visible contact/correction channel, source/mission audit trail, disable/unpublish action that preserves evidence, response process for organizer corrections and image takedowns, license-expiry/removal handling, and logs of who approved or changed records.
