# Product and UX specification

## Product promise

Local Lore should make scattered city information feel useful, human, and alive. It is not an exhaustive event database and not a list of generic attractions. It offers enough editorial framing that someone can choose an experience quickly: “I have two hours; what could make today feel better?”

The unit of value is a **mission**: a place or event plus a small way to engage with it. “Golden Gate Park” is generic; “cross five continents before lunch through five garden collections” is a mission.

## Experience principles

1. **Map first.** The city remains visible while every other interface appears as an overlay.
2. **Low friction.** No login, profile, saved-list ceremony, or airplane-cockpit control bank.
3. **Editorial before exhaustive.** A mission needs a specific reason to exist.
4. **Geographic honesty.** A zone must correspond to its real location and plausible footprint.
5. **Curiosity over directory search.** Prompts like Sunset and Odd & local are more inviting than a blank search field alone.
6. **Source trust.** The organizer remains the authority for schedule, price, rules, and booking.
7. **Progressive density.** At city scale, clusters communicate possibility; at neighborhood scale, zones become distinct.

## Primary flow

1. The visitor lands on a pitched map of San Francisco.
2. They visually scan clusters and zones, move the camera, or pick a curiosity/date filter.
3. Hovering a mission reveals its name, format, neighborhood, time, and price without forcing a click.
4. Clicking opens the detail card and focuses the camera.
5. The visitor reads the editorial reason, practical details, accessibility note, and seed warning.
6. They follow the canonical source to confirm and act.

## Discovery controls

- **Explore all missions** opens a wider visual mission gallery without turning discovery into an inventory count.
- **Quick filters:** Today, Free, Outside, Social. Multiple quick filters combine with AND semantics.
- **Curiosity filters:** Food ritual, Live music, Sunset, After dark, Make something, Odd & local, Scenic drive. These are mutually exclusive in the map overlay.
- **Calendar:** All time plus seven dates starting today. Date-specific choices enforce mission availability; All time deliberately disables that check.
- **Mission browser:** query prompts, category grid, traits, time slot, budget, reset action, and a three-column desktop/two-column mobile card gallery. Records with licensed imagery show that photo; every other card uses a compact source-site preview displaying the original organizer name and hostname, not an unreliable embedded third-party page.
- **Search:** lower-cased token AND match over title, kicker, description, why, neighborhood, venue, category, format, vibes, and traits. Words shorter than three characters and a small stop-word list are ignored.

All selected dimensions combine with AND semantics. A no-results overlay offers a one-click reset.

Mission totals are intentionally not displayed in the visible interface. Counts made the experience feel like a directory; the map density and card gallery communicate breadth more naturally. Calendar day numbers remain because they are dates, not inventory.

Every filter is also a map filter. The same filtered ID set replaces both activity-zone polygons and clustered mission points, so anything that does not match vanishes from the map rather than merely disappearing from the list. A filter change also clears a hover popup or selected detail if that mission is no longer eligible. Selecting Today after All time returns the calendar to the actual Today date before filtering.

## Map controls and gestures

- Primary desktop pan: left drag.
- Rotate/pitch: right drag or the rotate/tilt buttons.
- Zoom: wheel/trackpad, double click, box zoom, and keyboard. There are no visual plus/minus controls.
- Touch: one finger pans; two fingers zoom and rotate; two-finger vertical movement changes pitch.
- Rotate button: advances the bearing by 35 degrees and ensures a useful pitch.
- Tilt button: cycles between roughly 46°, 70°, and top-down.
- Whole-city button: restores the `SF_HOME` camera.

## Desktop layout

- The map occupies `100dvh`.
- Brand, editorial heading, discovery controls, and date rail float at the upper left.
- Camera actions sit at the upper right; attribution sits at the lower right.
- The mission browser opens as a right-side overlay.
- The selected mission card opens at the lower left so the map context remains visible.

## Mobile layout

- The map remains full-screen and touch-first.
- The top overlay is deliberately reduced to the compact brand and a single Explore button; the headline and map-overlay filters are removed.
- The mission browser becomes a bottom-positioned sheet-like overlay.
- The sheet contains horizontally scrollable Quick pick, Follow a thread, and Plan by date rows before the structured filters and card gallery.
- The detail card spans the screen with safe margins and hides long explanatory copy to preserve map access.
- Map attribution is currently hidden at the smallest layout to prevent obstruction; this should be revisited before public release so attribution remains accessible through an alternative compact affordance.

## Content voice

- Specific, warm, concise, observant.
- Focus on what to do, notice, compare, taste, hear, or follow.
- Avoid hype, tourism clichés, scraped marketing copy, and generic adjectives.
- Explain why the experience is worth the time in one or two original sentences.

## Accessibility

- All custom controls are native buttons or links with accessible names.
- `/` opens and focuses search; Escape closes overlays and selection.
- MapLibre keyboard navigation remains enabled.
- `:focus-visible` receives a clear mint outline.
- Text and panels maintain high contrast over the map.
- `prefers-reduced-motion: reduce` suppresses pulse animation and shortens transitions.
- Image alt text describes the place rather than repeating the mission title.
- Accessibility fields should describe known terrain, route, seating, transit, or venue accommodations without making unverified promises.

## Explicit non-goals for V1

- Accounts, favorites, social graph, messaging, ticket sales, or personalization profiles.
- Exhaustive venue coverage.
- Live location tracking.
- Turn-by-turn navigation.
- User submissions flowing directly to publication.
- Automated scraping of arbitrary websites.
