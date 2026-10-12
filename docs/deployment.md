# Deployment guide

## Status

The Vercel production path is a Next.js map product with a static catalog and one database-backed visitor route. It has no scheduled job, source fetch, or AI dependency. Treat every hosted release as a PMTiles compatibility test, especially for HTTP byte ranges.

## Vercel path

`vercel.json` declares the Next.js framework and `npm run build:vercel`. The map uses no map token, but visitor capture requires the server-side `DATABASE_URL` or `POSTGRES_URL` environment variable in Vercel.

Expected deployment inputs include application source, lockfile, and `public/maps/san-francisco-region.pmtiles` (about 87.6 MiB; below GitHub’s 100 MiB per-file limit). The archive is a regional extract, not a runtime hotlink to the full Protomaps planet build.

### Vercel release procedure

1. Run lint, strict typecheck, `npm run build:vercel`, and tests.
2. Deploy a preview, not production.
3. Verify root HTML and static JS/CSS.
4. Verify PMTiles byte ranges using the commands below.
5. Perform full desktop/mobile map smoke tests.
6. Confirm organizer links and remote licensed images.
7. Confirm OpenStreetMap/Protomaps attribution.
8. Only then promote the same artifact/configuration to production.

## PMTiles range verification

Replace the origin and run:

```bash
curl -I https://example.com/maps/san-francisco-region.pmtiles
curl -i -H 'Range: bytes=0-126' https://example.com/maps/san-francisco-region.pmtiles
```

The range request should return `206 Partial Content`, a correct `Content-Range` beginning `bytes 0-126/`, an appropriate `Content-Length` of 127 for that response, and binary data rather than HTML. `Accept-Ranges: bytes` is strongly expected. Verify cache/CDN behavior does not strip Range.

If the response is `200` with the entire file, HTML, a redirect loop, missing length, or an incorrect range, the map may remain blank. Fix static asset handling rather than changing MapLibre layers.

## Required external access

The deployed browser needs access to:

- same-origin application assets and PMTiles archive;
- `protomaps.github.io` for label glyphs;
- Local `/images/missions/` assets for the manifest-backed primary photos, plus Wikimedia Commons for the three legacy optional licensed photos;
- organizer sites only after the user opens a source link.

A future Content Security Policy must include these exact needs or self-host the glyphs/images where permitted.

## Cache policy recommendations

- Fingerprinted JS/CSS: long immutable cache.
- PMTiles versioned query/archive: long cache with immutable content; update the version when the archive changes.
- HTML: standard revalidation appropriate for releases.
- Glyphs: follow upstream caching or self-host with long immutable cache.

## Catalog updates

Catalog updates happen outside Vercel. A human-reviewed agent edits the source-grouped JSON catalog and related source policy, runs validation, and commits through GitHub. Vercel deploys that commit. No Vercel cron or runtime ingestion route is active.

## Rollback

Keep the previous deployment artifact/commit available. Because catalog and map archive ship statically, rollback is normally an application deployment rollback. If persistence activates later, application rollback and schema/data rollback become separate operations and require a compatibility plan.

## Post-deploy smoke checklist

- Root has correct title and metadata.
- Map ready/source loaded with no `data-map-error`.
- 3D buildings, labels, water, parks, roads, clusters, and accepted activity areas visible; unknown areas remain honest point artwork.
- Pan/zoom/rotate/tilt/whole-region reset work throughout the bounded Bay Area.
- Any day shows the available catalog; future live event integration must preserve separately labeled ideas and published occurrences.
- Preview shows title/description without an Explore action; selecting a mission opens the correct selected card and suppresses its preview.
- Selected card hierarchy is legible: truthful image or compact activity artwork fallback, venue title, specific sentence, three facts, one website CTA, optional Info disclosure.
- Source links, historical check dates, unconfirmed schedules, accessibility, and photo rights/provenance remain available through the card/Info disclosure.
- PMTiles range and cache headers pass.
- No secrets, console exceptions, hydration errors, or 404 assets.

## Location permission checklist

- On localhost, `127.0.0.1`, IPv6 loopback, and `*.localhost`, the location control is hidden and no browser permission request occurs.
- On a deployed secure non-loopback host, the control requests browser geolocation only after the visitor activates it. No coordinates are stored or sent.
- Verify requesting, denied, unavailable, outside-covered-Bay-Area, retry, and unchanged/moved-camera outcomes have clear status.
- A denied or unavailable request offers retry without trapping the visitor; an outside result leaves the map usable and does not move outside supported bounds.
- A stale callback or camera movement must not overwrite a newer view; existing pan/zoom/rotate/tilt gestures and whole-region navigation remain intact.
# Share preview metadata

The App Router special route `app/opengraph-image.tsx` generates the 1200×630 PNG used by Open Graph and Twitter cards. It is a code-rendered, static representation of the opening Local Lore map (not a live MapLibre screenshot), which keeps previews reliable in Vercel’s serverless/edge runtime.

Before publishing under a real domain, set `NEXT_PUBLIC_SITE_URL` to that canonical HTTPS origin (for example, `https://locallore.example`). `app/layout.tsx` uses it as `metadataBase` so relative card image URLs resolve correctly for external crawlers. The Vercel fallback is `https://local-lore.vercel.app`.
