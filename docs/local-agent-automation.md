# Local agent automation runbook

## System boundary

There are two unrelated data systems:

| System | Holds | Writer |
|---|---|---|
| GitHub repository | Local Lore missions, source directory, images, and documentation | Local catalog agent |
| PostHog | Anonymous visitor analytics, replay, device and approximate geography | Browser SDK only |

Do **not** write missions, source content, or organizer facts into PostHog. Do **not** make the website read catalog data from PostHog. It is analytics, not the Local Lore catalog database.

## Daily local-agent job

Run once per day from a machine that has this repository, Node/npm, Git credentials, and the chosen local agent runner. The runner can be macOS `launchd`, a local cron service, or a manually started agent session; scheduling is machine-specific and is not committed to this repository.

```text
open repository at latest master
→ read policy + source directory
→ check only approved sources
→ normalize/deduplicate facts
→ edit seed catalog and optional image manifest
→ run validation
→ commit and push only if valid changes exist
→ Vercel deploys the pushed commit
→ write a local run summary for the operator
```

## Required agent instructions

The scheduler or agent prompt must direct the agent to read, in order:

1. `AGENTS.md`
2. `README.md`
3. `docs/agent-handoff.md`
4. `docs/local-agent-playbook.md`
5. this file
6. `docs/source-and-image-policy.md`
7. `docs/catalog-and-data-model.md`

## Source policy

The agent may only automate a source when `lib/sources/source-directory.ts` and `docs/source-and-image-policy.md` document a public API/feed or equivalent automation permission. The directory is non-exhaustive; adding a source requires recording its name, canonical URL, type, attribution, cadence, and permission basis before it is fetched automatically.

For an ordinary organizer page, the agent may use it as a human/local research lead but must not build an unattended scraper around it. Never bypass a robots rule, login, CAPTCHA, paywall, rate limit, or anti-bot control.

## Catalog update rules

- `lib/seed-data.ts` is the published catalog source of truth.
- Preserve every `LoreItem` factual field: source name/URL/check date/status, coordinate, zone radius, price, schedule, accessibility, and image metadata where applicable.
- Coordinates are `[longitude, latitude]`; zones must stay within `SF_BOUNDS`.
- Use original Local Lore framing. Do not copy source descriptions.
- New temporary activities need dates and expiry. Ambiguous candidates are skipped, not invented.
- Image additions require documented permission and the complete `MissionImage` record.

## Validation and publish gate

Run before every push:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
```

Then visually confirm map range loading, category colors, filter hiding, glyph anchoring, mobile layout, source link, and no console error. If a check fails, do not push. Record the blocker and leave the prior catalog deployed.

## Git publishing

Use a small, descriptive commit such as `data: refresh approved SF sources` or `data: add mission at <venue>`. Push only the catalog, source policy, image manifest, and documentation files relevant to the update. Never commit `.env*`, `node_modules`, build output, credentials, or local scheduler logs.

## PostHog relationship

The browser automatically sends anonymous usage events to PostHog. The local catalog agent does not need a PostHog API key and must not query visitor data to decide what to publish. PostHog may inform future editorial decisions in aggregate, but it is never a source of factual event data.

## Run summary template

```text
Date:
Sources checked:
Sources skipped and why:
Candidates found / published / rejected:
Catalog IDs changed:
Validation result:
Git commit:
Notes or follow-up:
```
