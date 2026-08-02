# Design system

## Direction

Local Lore combines the clarity of a modern product, the warmth of a field guide, and the discovery rhythm of a crafted city map. It avoids generic startup gradients, dense dashboards, obvious pin markers, permanent title labels, and excessive chrome.

## Color system

Core CSS tokens in `app/globals.css`:

- `--ink: #f0f4f1` — primary text.
- `--muted: #9aaba5` — secondary content.
- `--panel: rgba(21,31,28,.93)` — deep green overlay.
- `--line: rgba(218,238,231,.14)` — restrained borders.
- `--lime: #8edcc4` — mint discovery/focus accent.
- `--coral: #f09b84` — secondary warm accent.

The original harsher yellow/black direction was replaced with deep botanical green, water blue-green, mineral gray, mint, and per-mission accents. Glass effects use blur and translucency only to maintain map context, not as decoration by themselves.

## Typography

- UI: Avenir Next with Segoe UI/Helvetica/Arial fallbacks.
- Editorial italic/mark: Iowan Old Style with Baskerville/Times fallbacks.
- No remote font dependency.
- Discovery prompts use 11 px with icon support; tiny metadata remains compact but should never carry the only important information.
- Headline uses a tight, editorial, responsive scale.

If changing type, test actual macOS, Windows, iOS, and Android fallback metrics before adjusting fixed component widths.

## Spatial hierarchy

- Full viewport map establishes context.
- Compact brand identifies the product without reserving a top bar.
- “Where next?” leads to one primary action.
- Quick and curiosity filters stay near the question and are directly manipulable.
- Detailed filtering is deferred to MissionBrowser.
- Mission detail occupies one corner/sheet and never replaces the map.
- The mission browser uses visual cards in a wide gallery. It does not announce catalog/category/result totals.

## Shape language

- Activity zones are soft geographic halos with thin edges and subtle extrusion.
- Controls use 10–13 px radii; primary overlays use 19–22 px radii.
- Brand mark is an imperfect rotated circle, giving the field-guide warmth.
- Pills are reserved for quick or multi-select dimensions; categories use compact grid cells.

## Icons

Lucide icons support familiar interface actions and curiosity prompts. Map categories use a separate typographic glyph vocabulary because the glyphs must render efficiently inside a MapLibre symbol layer.

Icons are never the only accessible name. Buttons carry readable text or `aria-label`. Do not animate every icon continuously; current ambient motion is concentrated at mission centers. If prompt icons gain micro-motion later, use short hover/focus transitions and respect reduced motion.

## Motion

- Map camera easing: 600–850 ms for deliberate spatial continuity.
- Mission browser/detail: short Framer Motion opacity/translation transitions.
- Mission pulse: sine wave updates radius and stroke opacity; disabled for reduced motion.
- Hover controls: color/border/one-pixel lift, not large movement.

Motion should explain location, selection, or hierarchy. Avoid decorative loops in filters and cards.

## Map overlays

Panels use dark green translucency and `backdrop-filter` to remain legible over diverse map geometry. `map-vignette` gently protects upper-left text and avoids a hard black edge. Avoid large opaque blocks that make the product feel like a directory laid over a map.

## Responsive rules

At 720 px and below:

- brand remains compact while the headline and map-overlay filter rows are removed;
- one Explore button opens the mission sheet, where quick, curiosity, and date rows scroll horizontally;
- control stack moves to 12 px from top/right;
- mission browser becomes a bottom sheet;
- activity details condense and hide the two longer prose paragraphs;
- attribution is hidden in the current CSS and needs an accessible release solution.

At 390 px and below, headline and spacing tighten further, and one fact is hidden to prevent card overflow.

## Dark and light themes

V1 declares `color-scheme: dark` and implements only the dark theme. A future light theme should define semantic tokens and a separate map flavor, then test mission colors, water/park differentiation, overlays, popups, focus states, attribution, and 3D depth. Do not simply invert colors.

## Visual QA checklist

- The city remains the largest visual object.
- UI does not overlap the three map controls at supported widths.
- Curiosity words and icons are readable without zooming the browser.
- Date rail includes All time and scrolls rather than compressing.
- Popup and detail text survive both dark land and water backgrounds.
- Mission glyph and zone center coincide at multiple pitches/bearings.
- No hard black overscan edge appears inside allowed bounds.
- Hover and focus states are visible but not fluorescent.
- Licensed images crop cleanly and retain credit in details.
