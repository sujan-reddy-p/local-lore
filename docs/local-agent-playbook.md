# Local catalog agent playbook

## Role

The local catalog agent is separate from the deployed website. Its job is to maintain the Git-tracked catalog, not to run inside Vercel, alter the visitor experience, or depend on a runtime database.

For the daily scheduled workflow, operational boundaries, publish gate, and run-summary format, read `docs/local-agent-automation.md` immediately after this playbook.

```text
approved source directory → local agent → validate + edit seed catalog → tests → GitHub commit → Vercel static deploy
```

The website reads only `lib/seed-data.ts`. A new Git commit is the publish action and Vercel's Git integration deploys it.

## Inputs

- `lib/seed-data.ts`: published `LoreItem` catalog.
- `lib/sources/source-directory.ts`: known organizers and feeds. Existing entries are leads, not automatic permission.
- `docs/source-and-image-policy.md`: mandatory source, automation, and image rules.
- `docs/catalog-and-data-model.md`: exact publish contract and QA rules.
- `lib/mission-images.ts` and `docs/mission-image-workflow.md`: image manifest and naming rules.

## Daily workflow

1. Read the source policy and source directory.
2. Check only sources with a documented feed/API/permission basis. Do not crawl ordinary organizer pages merely because they appear in the directory.
3. Capture factual candidate fields: canonical source URL/name, event or venue title, time/date, price if stated, location, coordinates, and access context.
4. Reject a candidate if its source, location, date, or organizer is ambiguous. Never fill factual gaps with model inference.
5. Deduplicate against `lib/seed-data.ts` by canonical URL, venue, time, and geographic footprint.
6. Write concise original Local Lore framing. Preserve the source link and accurate `curated-seed` / future live status.
7. Add or update `LoreItem` records directly in `lib/seed-data.ts`; use `[longitude, latitude]` and a realistic `zoneRadiusM`.
8. Add an image only when permission and every `MissionImage` field are known. Otherwise use the existing visual fallback.
9. Run the validation commands below, visually inspect desktop and mobile map behavior, then commit the catalog and documentation together.

## Required checks

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
```

For a map/data change also confirm: zones retain category color, glyphs stay centered through pan/zoom/tilt/rotation, filters hide non-matching zones, source links work, and no mission appears outside SF bounds.

## Publishing rule

Never edit production data directly. The local agent commits the reviewed files to GitHub. Vercel builds the committed static artifact. If a bad catalog update ships, revert the commit and redeploy through Git history.

## What the local agent must not do

- Do not add Vercel cron jobs, runtime scraping, database writes, browser credentials, or API keys to the website.
- Do not claim a source is live merely because it can be opened.
- Do not copy source descriptions or images without permission.
- Do not make the map component source-specific.
- Do not convert zones into generic pins.
