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

Before automated fetching, record source kind, canonical URL, attribution, relevant terms/robots or feed documentation, whether automation is allowed, rate limits, refresh cadence, and whether media reuse is allowed.

Public visibility is not permission to scrape. An organizer webpage with no approved feed remains manually curated. Do not bypass authentication, CAPTCHAs, bot protection, rate limits, paywalls, or technical access controls.

## Content usage

- Store factual fields needed to help a visitor decide and reach the source.
- Write original Local Lore mission title, framing, and explanation.
- Do not republish full source descriptions, articles, or marketing copy.
- Use short factual names such as venue and organizer accurately.
- Link directly to the organizer’s actionable page.
- Keep attribution visible in mission details and map attribution.
- Honor corrections and removal requests promptly when a live system exists.

## Seed versus live status

`curated-seed` means a human assembled a believable prototype record and checked a source on the stored date. It does not mean the activity is available now.

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

When rights are unclear, omit the image. In the mission browser, the fallback is a compact source-site preview containing only the stored source name, hostname, venue, glyph, and Local Lore styling—not copied page content or an embedded third-party page. The detail view uses the venue-and-neighborhood visual panel. Do not generate or search for a visually similar substitute.

## Current images

The project owner has confirmed creator permission for the local primary mission images listed in `lib/mission-images.ts`. These files are served from `public/images/missions/`; the `MissionImage` record keeps the permission basis internally without adding a visible credit treatment.

Three legacy seed missions reference Wikimedia Commons through `Special:Redirect/file` and store a Commons file page, credit, license, and alt text:

- Ferry Building — CC BY-SA 2.5.
- 16th Avenue Tiled Steps — CC BY 4.0.
- Wave Organ — CC BY 2.5.

Recheck each source page before a public launch because attribution and file status can change. If a source cannot be confirmed, remove the image field; the mission remains fully usable.

## Initial automated source

The first enabled automated source is San Francisco Recreation & Parks' Golden Gate Bandshell iCalendar feed. The agency publishes the feed for calendar subscription from its [iCalendar page](https://sfrecpark.org/iCalendar.aspx), so Local Lore checks the feed no more than once per day and does not reuse any source images. All other initial source-directory records remain link-only until an equivalent public-feed or automation policy is recorded.

## AI and source trust

AI can summarize normalized facts into original short framing, categorize, tag, and propose duplicates. It cannot create provenance, permissions, licenses, dates, prices, coordinates, or accessibility facts. A model’s confidence is not evidence.

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
