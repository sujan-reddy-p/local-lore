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

## Automation permission

Before recurring automated fetching, record source kind, canonical URL, attribution, relevant terms/robots or feed documentation, whether automation is allowed, rate limits, refresh cadence, and whether media reuse is allowed.

Public visibility is not permission to scrape. An organizer webpage with no documented permitted feed or page access remains unavailable to automated research; the local researcher must verify access terms, policy/robots/feed evidence, rate limits, and attribution before use. Do not bypass authentication, CAPTCHAs, bot protection, rate limits, paywalls, or technical access controls.

## Agentic publication and access controls

The active catalog path is an agentic researcher followed by deterministic validation and a bounded Git snapshot. A mandatory human approval/review queue is not required. This does not weaken source access controls: each source must have a documented canonical URL, permitted access method, relevant terms/robots or feed documentation, attribution, rate limits, refresh boundary, and media-rights basis before it is used.

The 2026-10-11 one-time read-only audit authorization is historical audit scope, not a recurring fetch requirement or publication gate. `approved_for_display` and `needs_source_review` remain lineage/eligibility labels. Public visibility, an accessible URL, or model confidence never grants permission. Do not bypass authentication, CAPTCHAs, bot protection, rate limits, paywalls, or technical controls.

Agents must preserve provenance and security boundaries, and must not invent factual fields or image rights. Human correction, takedown, and manual review workflows are not implemented now; retain evidence so a later correction path can be added.

## Privacy

This source policy concerns the provenance and permitted use of public source material; it is not a visitor privacy policy. The website separately collects visitor data as documented in `docs/visitor-capture.md` and `docs/analytics.md`.


## Content usage

- Store factual fields needed to help a visitor decide and reach the source.
- Write original Local Lore mission title, framing, and explanation.
- Do not republish full source descriptions, articles, or marketing copy.
- Use short factual names such as venue and organizer accurately.
- Link directly to the organizer’s actionable page.
- Keep attribution visible in mission details and map attribution.
- Honor corrections and removal requests promptly when a live system exists.

## Existing catalog versus live status

The maintainer explicitly directed that the records already displayed on the website be treated as accurate and retained. They are marked `approved_for_display` on that basis; this is an assumption for existing catalog display, not an independent fact-check. It does not approve automated fetching or image reuse.

`curated-seed` means an existing Local Lore record assembled from historical source evidence on its stored check date. It does not mean the activity is available now or that the source is currently approved for automated access.

Future status language should distinguish:

- verified live in the latest successful source run;
- needs review because facts changed or confidence is low;
- expired or unavailable for the selected date;
- manually curated and awaiting recheck.

Never infer “live” merely from an accessible URL.

## Image rule

Do not generate images for Local Lore. Do not copy an image because it appears on an organizer page or in page metadata. Use an image only if an explicit license, public-domain status, or organizer permission allows this display.

Every image record must preserve:

- direct display URL;
- useful alt text;
- creator/owner credit;
- original source page URL;
- license or explicit permission basis.

The source registry’s `allowsImageReuse` must be independently true for automated media collection. Even then, preserve per-image metadata and comply with hotlinking/download/transform requirements.

When rights are unclear, omit the image. Hover, gallery, and detail use the shared `MissionMedia` venue/glyph/source-name fallback for missing, loading, or failed photos. It contains only stored facts and Local Lore styling, not copied page content, an embedded third-party page, or a simulated website screenshot. Successful photos expose stored credit, source-page link, and license in mission details. Do not generate or search for a visually similar substitute.

## Current images

The project owner has confirmed that the existing local primary images may remain displayed. Their image metadata is stored on each mission’s `image` field in `data/source-catalog.json`; files are served from `public/images/missions/`. This permission does not grant automated fetching or reuse of new images.

Three legacy seed missions reference Wikimedia Commons through `Special:Redirect/file` and store a Commons file page, credit, license, and alt text:

- Ferry Building — CC BY-SA 2.5.
- 16th Avenue Tiled Steps — CC BY 4.0.
- Wave Organ — CC BY 2.5.

Recheck each source page before a public launch because attribution and file status can change. If a source cannot be confirmed, remove the image field; the mission remains fully usable.

## Local-agent source checks

The SF Recreation & Parks Golden Gate Bandshell iCalendar feed remains an unreviewed source lead. Its historical one-time audit instruction does not establish recurring access conditions: keep it disabled until a permitted feed method, terms, rate limits, and rights basis are documented; no human approval queue is required.

## AI and source trust

AI is the local research worker and may summarize only rendered, source-backed facts into strict structured proposals. Deterministic validation/publishing applies those proposals to the static Git catalog. AI cannot create provenance, permissions, licenses, dates, prices, coordinates, accessibility facts, or image rights.

## Takedown and correction design

Before accepting public submissions or live ingestion, add:

- visible contact/correction channel;
- source/mission audit trail;
- disable/unpublish action that does not erase evidence;
- response process for organizer corrections and image takedowns;
- license-expiry/removal handling;
- logs of who approved or changed a record.

## Pre-publication checklist

- Canonical source is primary, HTTPS, and reachable.
- Organizer/venue/title/location refer to the same activity.
- Automation basis is documented if fetched.
- Editorial copy is original and concise.
- Date/time/price/access facts are traceable to the source.
- Seed/live label is accurate.
- Image permission and attribution are complete or the image is omitted.
- Expiry and refresh behavior are defined.
