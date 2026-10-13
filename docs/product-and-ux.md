# Product and UX specification

## Product promise

Local Lore should make scattered city information feel useful, human, and alive. It is not an exhaustive event database and not a list of generic attractions. It offers enough editorial framing that someone can choose an experience quickly: “I have two hours; what could make today feel better?”

The unit of value is a **mission**: a place or event plus a small way to engage with it. “Golden Gate Park” is generic; “cross five continents before lunch through five garden collections” is a mission.

## Experience principles

1. **Map first.** The city remains visible while every other interface appears as an overlay.
2. **Low friction.** No login, profile, saved-list ceremony, or airplane-cockpit control bank.
3. **Editorial before exhaustive.** A mission needs a specific reason to exist.
4. **Geographic honesty.** Supported geometry represents its actual location; the 25–100 m ground circle is only a locator fallback, never a claimed physical footprint.
5. **Curiosity over directory search.** Prompts like Sunset and Odd & local are more inviting than a blank search field alone.
6. **Source trust.** The organizer remains the authority for schedule, price, rules, and booking.
7. **Progressive density.** At city scale, clusters communicate possibility; at neighborhood scale, zones become distinct.

## Primary flow

1. The visitor lands on a pitched map of San Francisco.
2. They scan the map, move the camera, search, choose one interest, or choose a date.
3. A map preview provides the mission title and concise description; it has no Explore action. The preview for the selected mission is suppressed.
4. Clicking a mission opens the selected card and focuses the camera.
5. The card leads with a truthful image (or compact activity artwork fallback), venue title, a specific activity sentence, three practical facts, and one website CTA.
6. The visitor may open native inline Info disclosure for source/schedule, accessibility, and photo rights/provenance, then follows the canonical source to confirm and act.

## Discovery controls

- **Discovery:** a hamburger opens the panel, hidden by default on desktop and mobile. The closed panel remains mounted but inert and preserves filters. Opening focuses search; Escape closes and restores focus to the trigger.
- **Interests and dates:** the opened panel keeps the eight interests and Bay Area date choices compact. One interest may be active; selecting it again clears it. Dates include Any day, Today, Tomorrow, Weekend, and arbitrary native-picker dates. These are schedule filters, not live confirmation.
- **Refinement:** Filters replaces interests with only Budget and approximate activity-time sliders; time is in hours and excludes travel. No duplicate category/trait controls. Reset all clears search, interest, date, budget, and time.
- **Map filtering:** search, interest, date, budget, and time use AND semantics. A selected detail clears when ineligible; empty results offer reset.
- **Trust:** the selected card’s Info disclosure retains known schedule/source status, accessibility text, and image credit/license/source. The organizer remains the authority for current schedule, price, rules, and booking; a historical check date or source link is not a live refresh.
- **Search:** lower-cased token AND match over title, kicker, description, why, neighborhood, venue, category, format, vibes, and traits. Words shorter than three characters and a small stop-word list are ignored.

Mission totals are intentionally not displayed. Calendar choices remain because they are dates, not inventory.

## Practical design review

Review each journey for a clear visual hierarchy (image → venue/title → specific action sentence → three facts → one CTA), readable scale/contrast, one restrained elevation, and progressive disclosure for secondary trust details. Prefer meaningful copy and calm map context over extra controls or generic card patterns. This applies the primary guidance from [Anthropic’s frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [Impeccable](https://github.com/pbakaus/impeccable), and NN/g’s [Cards Component](https://www.nngroup.com/articles/cards-component/).

## Map controls and gestures

- Primary desktop pan: left drag.
- Rotate/pitch: right drag or the rotate/tilt buttons.
- Zoom: visible plus/minus, wheel/trackpad, double click, box zoom, and keyboard. Camera zoom reaches 18; native zoom-14 tiles are overzoomed above that.
- Touch: one finger pans; two fingers zoom and rotate; two-finger vertical movement changes pitch.
- Rotate button: advances the bearing by 35 degrees and ensures a useful pitch.
- Tilt button: cycles between roughly 46°, 70°, and top-down.
- Region button: restores the `BAY_AREA_HOME` camera.

## Desktop layout

- The hamburger opens discovery; it is hidden by default. Closed controls stay mounted but inert and preserve state. The compact open panel contains search, interests, dates, and only budget/time refinement.
- The selected mission card opens in the lower-left corner so map context remains visible. It is not a gallery or a second map surface.

## Mobile layout

- The map remains full-screen and touch-first.
- The hamburger opens the same compact panel, hidden by default on mobile. While closed, controls are inert and state persists; opening focuses search, Escape closes and restores focus. Do not silently remove controls when open.
- Selecting a mission opens the selected card; its content scrolls within the available viewport when needed. Native Info disclosure preserves source/schedule, accessibility, and photo provenance.
- Map tools hide while the selected mobile detail is open so they cannot cover its actions; attribution remains visible.

## Content voice

- Specific, warm, concise, observant.
- Focus on what to do, notice, compare, taste, hear, or follow.
- Avoid hype, tourism clichés, scraped marketing copy, and generic adjectives.
- Explain why the experience is worth the time in one or two original sentences.

## Accessibility

- All custom controls are native buttons or links with accessible names.
- `/` opens discovery and focuses search; Escape closes overlays and selection and restores discovery-trigger focus when applicable.
- MapLibre keyboard navigation remains enabled.
- `:focus-visible` receives a clear mint outline.
- Text and panels maintain high contrast over the map.
- `prefers-reduced-motion: reduce` disables camera easing and shortens overlay/media transitions. Map centers do not pulse.
- Image alt text describes the place rather than repeating the mission title.
- Accessibility fields should describe known terrain, route, seating, transit, or venue accommodations without making unverified promises.

## Explicit non-goals for V1

- Accounts, favorites, social graph, messaging, ticket sales, or personalization profiles.
- Exhaustive venue coverage.
- Live location tracking.
- Turn-by-turn navigation.
- User submissions flowing directly to publication.
- Automated scraping of arbitrary websites.
