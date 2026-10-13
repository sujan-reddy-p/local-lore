# Design system

## Direction

Local Lore combines the clarity of a modern product, the warmth of a field guide, and the discovery rhythm of a crafted city map. It avoids generic startup gradients, dense dashboards, obvious pin markers, permanent title labels, and excessive chrome.

Close-up direction: preserve the city and 3D buildings while keeping ground-level activity areas quiet and geographically honest. A preview is a lightweight map label/card with title and description only; it has no Explore action and disappears for the selected mission. The selected card has one hierarchy: truthful image (190px desktop/140px mobile when available, compact 96px activity artwork on missing/error), venue title, specific action sentence, three facts, one website CTA, then optional Info disclosure.

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
- The hamburger opens discovery, hidden by default desktop/mobile. Closed panel stays mounted but inert and preserves filters. Open focuses search; Escape closes and focus returns to trigger. Open interests and dates are compact; refinement has budget/time sliders only.
- The selected card occupies one corner/sheet and never replaces the map. The preview and selected card are distinct states, not a gallery.
- Card hierarchy is image → venue/title → specific activity sentence → three fact rows with 20px Lucide icons and legible 16px values → one website CTA. Source, schedule, accessibility, and image rights/provenance remain behind native inline Info disclosure.

## Shape language
- Every mission keeps a visible 25–100 m ground locator circle when authentic geometry is unavailable or visually tiny. This is not a physical footprint. Prefer sourced Polygon/MultiPolygon with holes, string evidence and URL; then a legitimate matching native outline.
- Routes are start-first; only exact sourced course geometry or typed `connection` with exactly two geocoded actual endpoints can render on focus. Connections are dashed/directed. Areas are never courses.
- Controls use 10–13px radii; the primary rail/card uses 19–22px radii. Use one restrained elevation rather than stacked floating slabs.
- Pills are reserved for compact date/refinement states; interests are compact rounded-square grid buttons.

## Icons

Lucide icons support familiar controls, interests, facts, and Info disclosure. Map activity badges use subject-specific rounded-square custom SVG/retina PNG assets in `public/map-icons`, with editable SVGs and ISC/MIT `LICENSE.txt`; regenerate with `npx tsx scripts/generate-map-icons.mjs`. The generator also produces native 1×/2× MapLibre sprites so marker artwork is registered before symbols render. Do not reintroduce Unicode category glyphs, asynchronous per-marker image registration, or activity-purpose labels.

Icons are never the only accessible name. Buttons carry readable text or `aria-label`. Map centers are static; use short hover/focus transitions rather than ambient animation.

## Motion

- Map camera easing: 600–850 ms for deliberate spatial continuity.
- Mission browser/detail: short Framer Motion opacity/translation transitions.
- No animated mission pulse. Camera transitions honor reduced motion; media and panel transitions are reduced or disabled.
- Hover controls: color/border/one-pixel lift, not large movement.

Motion should explain location, selection, or hierarchy. Avoid decorative loops in filters and cards.

## Map overlays

Panels use dark green translucency and `backdrop-filter` to remain legible over diverse map geometry. `map-vignette` gently protects upper-left text and avoids a hard black edge. Avoid large opaque blocks that make the product feel like a directory laid over a map.

## Responsive rules

At 980px and below:

- hamburger-hidden discovery panel; opened state keeps interests and dates compact and exposes budget/time refinement only;
- selected cards scroll within available viewport; Info disclosure retains source/schedule, accessibility, and image rights;
- map tools hide while mobile selected detail is open; attribution remains available.

## Dark and light themes

V1 declares `color-scheme: dark` and implements only the dark theme. A future light theme should define semantic tokens and a separate map flavor, then test mission colors, water/park differentiation, overlays, popups, focus states, attribution, and 3D depth. Do not simply invert colors.

## Visual QA checklist

- The city remains the largest visual object.
- UI does not overlap map controls at supported widths.
- hamburger is keyboard accessible; closed controls are inert, opening focuses search, Escape closes and restores trigger focus;
- Preview has title/description only, no Explore action; selected preview is suppressed.
- Selected card hierarchy is image, venue/title, specific sentence, three legible fact values/icons, one website CTA, then optional Info.
- Missing/error media uses UI-owned subject artwork, never stock or newly generated catalog photos; authorized imagery priority is event, venue, logo, with credit/rights evidence.
- Authentic areas retain holes; every mission has a ground locator-circle fallback that is never claimed as a footprint.
- Focus states are visible but not fluorescent; reduced motion is respected.
