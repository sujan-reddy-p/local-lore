# Deployment guide

## Status

The Vercel production path uses Next.js and Neon Postgres. The application has a safe static-seed fallback if Neon is unavailable, while the agentic catalog reads published database records when available. Treat every new hosted release as a PMTiles compatibility test, especially for HTTP byte ranges.

## Vercel path

`vercel.json` declares framework `nextjs`, build command `npm run build:vercel`, and the daily `/api/cron/ingest` job. That command runs `next build --webpack`. The map uses no Mapbox token.

Required Vercel environment variables (set separately in Development, Preview, and Production) are `DATABASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `CRON_SECRET`, and `LOCAL_LORE_CRON_SECRET`. The two cron variables must contain the same value: Vercel sends `CRON_SECRET`, while the route uses the project-specific mirror. Keep their values out of Git and application logs. `OPENROUTER_API_KEY` is only used by the server-side ingestion route.

Expected deployment inputs include application source, lockfile, and `public/maps/san-francisco.pmtiles`. The archive is below GitHub’s normal 100 MiB per-file limit but large enough to affect clone and deploy transfer time.

### Vercel release procedure

1. Run lint, strict typecheck, tests, `npm run build`, and `npm run build:vercel`.
2. Deploy a preview, not production.
3. Verify root HTML and static JS/CSS.
4. Verify PMTiles byte ranges using the commands below.
5. Perform full desktop/mobile map smoke tests.
6. Confirm organizer links and remote licensed images.
7. Confirm OpenStreetMap/Protomaps attribution.
8. Only then promote the same artifact/configuration to production.

## Cloudflare/vinext path

`npm run build` runs vinext and emits a Worker-oriented `dist/`. `worker/index.ts` delegates app routing to vinext and contains optional image optimization. `vite.config.ts` conditionally adds D1/R2 resources from `.openai/hosting.json`; both are null now.

Do not assume `npm run start` proves the archive works. A previous local vinext production-server path produced a PMTiles content-length/range error even though compilation succeeded. Validate the actual platform asset server.

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

## Database and scheduled jobs

Neon Postgres is the active server-side catalog store. Apply each Drizzle migration before a release that depends on it:

```bash
npm run db:generate
npm run db:migrate
```

Vercel invokes `/api/cron/ingest` once daily at 15:00 UTC. The route requires Vercel's `CRON_SECRET` authorization header, bootstraps the seed directory idempotently, and checks only due sources with documented automated-fetch permission. It does not crawl every organizer link in the catalog.

Use separate database resources for development, preview, and production before handling non-seed data at meaningful scale. Monitor ingestion runs, source failures, decision counts, and database connection errors after every release.

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
