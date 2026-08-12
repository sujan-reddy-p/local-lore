# Deployment guide

## Status

The Vercel production path is a Next.js map product with a static catalog and one database-backed visitor route. It has no scheduled job, source fetch, or AI dependency. Treat every hosted release as a PMTiles compatibility test, especially for HTTP byte ranges.

## Vercel path

`vercel.json` declares the Next.js framework and `npm run build:vercel`. The map uses no map token, but visitor capture requires the server-side `DATABASE_URL` or `POSTGRES_URL` environment variable in Vercel.

Expected deployment inputs include application source, lockfile, and `public/maps/san-francisco.pmtiles`. The archive is below GitHub’s normal 100 MiB per-file limit but large enough to affect clone and deploy transfer time.

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
curl -I https://example.com/maps/san-francisco.pmtiles
curl -i -H 'Range: bytes=0-126' https://example.com/maps/san-francisco.pmtiles
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

Catalog updates happen outside Vercel. A local catalog agent checks approved sources, edits the typed seed catalog, validates the repository, and commits to GitHub. Vercel deploys that commit. Follow `docs/local-agent-playbook.md`; do not add a Vercel cron or runtime ingestion route.

## Rollback

Keep the previous deployment artifact/commit available. Because catalog and map archive ship statically, rollback is normally an application deployment rollback. If persistence activates later, application rollback and schema/data rollback become separate operations and require a compatibility plan.

## Post-deploy smoke checklist

- Root has correct title and metadata.
- Map ready/source loaded with no `data-map-error`.
- 3D buildings, labels, water, parks, roads, clusters, and zones visible.
- Pan/zoom/rotate/tilt/whole-city work.
- All time shows the seed catalog plus any published database missions.
- Hover/select maps to the correct mission.
- Mission browser and mobile sheet work.
- Source links, seed disclosure, and agent-maintained-directory disclaimer work.
- PMTiles range and cache headers pass.
- No secrets, console exceptions, hydration errors, or 404 assets.
# Share preview metadata

The App Router special route `app/opengraph-image.tsx` generates the 1200×630 PNG used by Open Graph and Twitter cards. It is a code-rendered, static representation of the opening Local Lore map (not a live MapLibre screenshot), which keeps previews reliable in Vercel’s serverless/edge runtime.

Before publishing under a real domain, set `NEXT_PUBLIC_SITE_URL` to that canonical HTTPS origin (for example, `https://locallore.example`). `app/layout.tsx` uses it as `metadataBase` so relative card image URLs resolve correctly for external crawlers. The Vercel fallback is `https://local-lore.vercel.app`.
