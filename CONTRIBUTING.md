# Contributing to Local Lore

## Before starting

Read `AGENTS.md`, then identify the smallest guide in `docs/` that covers the proposed change. Keep product changes map-first, source-respectful, and understandable without an account or onboarding flow.

## Branch and commit practice

- Use a focused branch for non-trivial work.
- Keep unrelated changes out of the commit.
- Prefer conventional commit subjects such as `feat: add date-aware mission source` or `fix: keep zone glyph centered while pitched`.
- Explain data-source and licensing changes explicitly in the commit or pull-request body.

## Engineering checklist

- TypeScript remains strict and no new `any` is introduced without explanation.
- Source-specific parsing stays behind an adapter.
- Map layer IDs and zoom ranges remain documented.
- Desktop mouse/keyboard and mobile touch paths both work.
- Reduced-motion mode remains usable.
- Interactive controls have accessible names and visible focus.
- Empty and no-result states are intentional.
- Source links open the canonical organizer page in a new tab.
- No secrets, tokens, cache output, generated build output, or local environment files are committed.

## Catalog checklist

- Coordinates and zone radius match the named venue or route.
- Title, kicker, description, and `why` are original editorial copy.
- Category, format, time slot, schedule, duration, price, vibes, traits, and accessibility are plausible and internally consistent.
- Source name, canonical HTTPS URL, status, and checked date are present.
- Scheduled records contain explicit dates; recurring records contain days when known.
- Any image has URL, alt text, credit, original source page, and a license or explicit reuse basis.
- Seed records remain labeled `curated-seed`.

## Verification

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run build:vercel
npm test
```

Then perform browser QA using `docs/development-and-testing.md`. For deployment-affecting work, verify PMTiles byte-range behavior using `docs/deployment.md`.

## Documentation requirement

Update the relevant Markdown guide whenever changing contracts, controls, filters, map thresholds, data status, adapters, persistence, commands, hosting, or known limitations. A future contributor should not need to infer architecture from code alone.
