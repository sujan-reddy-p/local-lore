# Experience-led Local Discovery

## Operating contract

This project is maintained by agents. Research is manually invoked through OMP; no installed JavaScript discovery/publishing pipeline, timer, cron, LaunchAgent, automatic commit, or automatic push exists. The user chooses invocation, schedule, and Git publication. No mandatory human approval gate applies to individual content records. Source access, security, truthful evidence, image rights, and publication quality remain mandatory.

**Current instruction: pause further geographic/catalog expansion until the user has reviewed the website's design quality.** Improve the design, performance, and maintenance instructions first. Do not interpret a city quota as permission to publish incomplete or repetitive records.

When expansion is resumed, the reusable request is:

> Discover [city or region] and its nearby neighborhoods/coast/countryside. Find distinctive, useful reasons to go: celebrated places, current energy, quieter local favorites, and meaningful social or personal experiences. Cover food, culture, adventure, nature, play, making, learning, nightlife, and connection—not just walks. Verify the actual experience, website, location, highlight, timing, and imagery. Publish complete, supported candidates only; retain incomplete findings as leads. Explain remaining coverage gaps and source failures honestly.

Use the explicitly requested local model, currently `openai-codex/gpt-6-luna`:

```sh
omp --model=openai-codex/gpt-6-luna -p "Read .claude/skills/local-discovery/SKILL.md. Discover [city/region] using its complete-candidate and breadth requirements."
```

If that model reaches its usage limit, record the blocker and preserve completed outputs. Do not silently switch models, fabricate completion, or have the integration owner do the research grunt work instead.

## 1. Build an experience brief before searching

Research reasons people would spend their time here, not an inventory of everything with coordinates. A map POI, municipal facility row, or generic park identity is a **lead**, not automatically a finished mission.

Use this breadth matrix as a starting point, then add genuinely local niches:

| Experience | Directions to probe |
| --- | --- |
| Taste and food rituals | Neighborhood bakeries, regional cuisines, a distinctive dish, food halls, market stalls, coffee culture, communal meals, food-making classes |
| Art, culture, and identity | Independent galleries, film programs, small museums, architecture, public art, neighborhood history, cultural celebrations, open studios |
| Music and night energy | Small stages, listening rooms, jazz, dance nights, comedy, unusual performances, all-ages options |
| Adventure and the outdoors | Surfing, paddling, sailing, climbing, cycling, skating, trail running, tide pools, dunes, viewpoints, coastal access, appropriately supported camping |
| Nature, quiet, and wonder | Wildlife viewing, gardens, seasonal blooms, coastal ecology, stargazing, peaceful places, accessible nature experiences |
| Making, learning, and mastery | Makerspaces, ceramics, cooking, repair, crafts, workshops, skill exchanges, public learning spaces |
| Play and friendly competition | Board games, arcades, sports, social leagues, mini golf, family play, playful unusual experiences |
| Belonging and contribution | Volunteer workdays, community gardens, neighborhood gatherings, cultural groups, welcoming recurring meetups |
| Discovery and serendipity | Small bookstores, record shops, creative markets, unusual collections, a worthwhile detour, distinctive local rituals |
| Seasonal and time-bound life | Festivals, screenings, performances, exhibitions, races, pop-ups, ecological seasons, holiday programs |

Probe who the experience suits: solo visitors, friends, couples, families, newcomers seeking connection, and people wanting quiet. Vary cost, physical effort, time commitment, time of day, and accessibility. Do not invent these facts when sources are silent.

For an ordinary mixed-city discovery batch, aim for at least six experience families, no single family dominating the batch, and no more than roughly one in ten candidates being a generic walk. These are research direction checks, not excuses to invent variety. A genuinely nature-focused coastal district can have a different mix, but must still distinguish surfing, wildlife, tide pools, cycling, viewpoints, community, food, and other supported experiences rather than rewriting the same walk repeatedly. Explain justified exceptions.

The previous goal of 100 distinct evergreen activities per configured major city remains a coverage goal, not a publication shortcut. Ongoing recurrences and dated occurrences do not inflate that evergreen count. Report shortfalls rather than padding them.

## 2. Cover places, not only city polygons

Use `data/discovery-config.json` for the meaningful nearby cutoff: Bay Area bounds plus the configured 75 km straight-line radius. It is not a driving-time estimate. Use `data/coverage-boundaries.geojson` for reproducible incorporated-city counting; never replace city membership with city-center proximity.

Maintain a geographic gap map alongside city counts: neighborhoods, South San Francisco, Pacifica, Half Moon Bay, the nearby coast, beaches, harbors, trails, open space, and other worthwhile nearby destinations. Coastal/countryside opportunities are not discarded merely because they sit outside a major-city polygon. Do not assign Stanford or a neighboring town to another city just to satisfy a quota.

## 3. Discover broadly; verify narrowly

1. **Listen for local energy.** Search recent local reporting, neighborhood publications, cultural calendars, visitor guides, community discussions, specialist communities, and reputable recommendation lists. These provide leads and context, not automatic factual authority.
2. **Probe several niches and neighborhoods.** Search combinations of place, experience, current season, and visitor need. Seek established favorites, emerging/current activity, and quieter finds. Do not call something a secret, hidden gem, locals-only, or hip merely because an agent found it.
3. **Move to the actual source.** Open the organizer, venue, official park, operator, or authoritative program page. Check the precise activity, place identity, current dates, booking/access conditions, and relevant factual details.
4. **Resolve the complete candidate.** Website, source evidence, place, highlight strategy, and imagery are part of the assignment—not tasks silently left for another agent.
5. **Cross-check consequential ambiguity.** Resolve similar venue names, closures, wrong-city matches, stale calendars, ambiguous addresses, and uncertain course geometry. A failed fetch or missing result is not closure or cancellation.

Respect terms, robots, authentication, security, rate limits, and image licensing. Do not bypass 403, CAPTCHA, authentication, or 429 controls. Use another genuinely independent permitted source when appropriate, not another endpoint to evade a restriction. Record inaccessible and unvisited sources distinctly.

## 4. Complete-candidate publication gate

Every proposed published candidate must contain:

- **A specific reason to go:** plain-language heading and a short explanation of what the visitor actually does. No generic filler, inflated claims, or duplicate wording for the same outing.
- **Usable website:** an organizer, venue, operator, official visitor page, or booking page relevant to this experience. A GIS endpoint, map-coordinate link, generic data-provider homepage, or search result is not a substitute for a venue website.
- **Traceable evidence:** actual source URL(s), short factual quotes, observation date, and honest confidence. Separate research/discovery references from the authoritative source.
- **Resolved place:** venue identity/address plus real coordinates and coordinate provenance. The website does not need to print numeric coordinates: verified identity/address may be matched to legitimate geographic data. Never copy sibling coordinates, guess a city center, or pretend a park centroid is a court, entrance, or course start.
- **Highlight strategy:** sourced footprint when appropriate; legitimate matching native outline otherwise; an honest visible locator halo if a boundary cannot be determined. Walking/running/cycling may use a verified path or a dashed directed connection between two geocoded endpoints, never an invented course. Start-first and zoom-aware display must avoid clutter.
- **Researched imagery:** inspect the event page first, then a suitable venue image, then a logo. Record direct image URL, creator/owner credit (or explicitly unknown), alt, source page, and known reuse/license evidence. Reuse an already authorized image of the same venue when appropriate. If permission is unclear, download the most suitable publicly accessible candidate locally for later user review, but do not publish it or claim permission. Missing imagery never excuses skipping the image search.
- **Time and practical facts:** canonical schedule, actual expiry for finite events, known price/duration/access conditions, and explicit unknowns. Do not invent free admission, opening hours, drop-in eligibility, friendliness, accessibility, or travel times.

An incomplete candidate remains a lead with named missing fields and the next source to inspect. It does not enter the display-eligible catalog just to make a count look good.

### Missing-image staging on every discovery and refresh run

For each item without a suitable published image, select the best publicly accessible candidate after checking event, venue, and logo sources. Download it to ignored `outputs/image-review/<record-or-lead-id>/`, **outside `public/`**. Record a manifest entry in `data/discovery-state.json` under `pendingImages`: record/lead ID, source page, original image URL, local file path, image kind, proposed alt, known creator/credit, observed date, MIME type, byte size, content hash, reuse evidence if any, and `status: "awaiting-image-review"` when rights are unclear.

Verify that the response decodes as an image, not an HTML error page. Use bounded downloads and reasonable dimensions; do not pull full-resolution galleries or bypass access controls. A failed download is a named incomplete task, not a successful staged asset.

Unclear permission is **not** a reason to skip this local staging step. It **is** a reason to keep the image off the website until the user reviews it. Do not put staged files in `public/`, point a published `record.image.url` at them, commit them to a public repository, set `allowsImageReuse: true`, or invent a license. Preserve the current authorized image or UI-owned fallback meanwhile. No general human gate is added to the agent-managed catalog; this review applies specifically to unclear-rights image publication.

Staged binaries are machine-local and ignored by Git. A fresh checkout retains the manifest but may not have the file; reproduce the download from its original URL, verify its hash where available, and do not claim it is ready locally before observing the file.

## 5. Worker assignments and supervision

Use disjoint, bounded OMP Luna leaf assignments. Prefer five explicitly named venues or a similarly bounded experience/source slice, with literal known coordinates where available and distinct output filenames. Give each worker the full candidate gate, the experience brief, geography, and its non-goals. The parent owns code, integration, and editorial decisions; workers own their research outputs.

Each worker must:

- Attempt every assigned item, or document the exact access/rate/model blocker; distinguish unvisited from failed.
- Return complete candidates, incomplete leads, source outcomes, exclusions, and actual counts separately.
- Save incremental output and finish the bounded assignment; not return “underway,” “will report later,” or a falsely complete handoff after spawning an unobserved child process.
- Resolve locations, websites, images, and geometry within its assignment. Do not silently omit required fields.
- Avoid builds, lint, formatters, tests, commits, and pushes mid-flight. The integration owner runs checks after integration.

Parent supervision checks actual files and source evidence, not confident prose. Reject copied coordinates, malformed JSON, unsupported dates, broad claims, duplicate venue/actions, generic walking inflation, and unresolved website/image fields. A quota failure or missing record is not evidence that a source family was exhausted.

## 6. Integrate, maintain, and report

Read the current catalog and authoritative content/design guides before editing. Deduplicate against the entire catalog by **physical venue and actual visitor action**, not just title or ID. Distinct documented amenities or genuinely different routes may coexist; rewordings and repeated amenity polygons do not count twice. Preserve established IDs, the best authorized images, supported geometry, original lineage, and good records after failed refreshes.

Use canonical `schedule.kind: "scheduled"`, `startsAt`, `endsAt`, and `expiresAt`, not `dated`/`start`/`end`. Date-only end bounds are inclusive through the Bay Area calendar day; offset timestamps expire at the actual instant. Evergreen and ongoing recurrences have no arbitrary TTL. Client expiry remains active even without another research run.

Ephemeral JSON processing under ignored `outputs/` is allowed for large catalog transformations; it is not a permanent discovery pipeline. Keep heavy audit evidence and discovery state out of the browser payload. `lib/seed-data.ts` projects only the display contract on the server; client/map modules must not import the raw catalog.

After integration, run catalog validation and project checks once, then exercise the actual website: source links, loaded/error/missing images, selected/hover cards, visible highlight fallback, route distinctions, filtering, keyboard behavior, mobile layout, map loading, and realistic interaction costs. Do not trade map quality for speed without evidence.

Report actual coverage by city and by region/experience, finite events separately, websites/image completion, checked/failed/unvisited sources, exclusions, and remaining leads. Derive counts directly from the final catalog and actual boundaries; never add an already-integrated count twice. No research run is complete merely because the skill was invoked.

Commit/push only when the user has requested publication. Preserve the user-controlled design-review pause and scheduling decision.
