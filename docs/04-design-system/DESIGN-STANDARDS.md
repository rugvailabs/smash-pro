# ProSmash — Design Standards & Tokens

> Status: ✅ Approved by owner — 2026-11-13 (WCAG 2.2 AA retained; Ember Deep
> is the mandated text-safe orange) · Last updated: 2026-11-13
> Values here are design decisions, not code. Token names are
> technology-neutral; implementation syntax is decided in the architecture
> phase.

## 1. Accessibility Standards

Target: **WCAG 2.2 AA** across all four surfaces.

1. **Contrast:** text ≥ 4.5:1 (normal) / 3:1 (large ≥ 24px or 18.7px bold);
   UI component boundaries and state indicators ≥ 3:1. Consequences already
   encoded in the palette: body text is `neutral.800`/`ink` on light; Smash
   Ember is never small text — Ember Deep is the text-safe accent. Every
   palette pair used in implementation gets verified with contrast tooling
   before sign-off.
2. **Never colour alone:** every status chip pairs colour with a label (and
   icon where space allows). Table rows flagged by state also carry a textual
   state cell.
3. **Focus:** every interactive element has a visible focus state — 2px
   `ember-deep` outline, 2px offset, on all surfaces. Focus is never removed,
   only styled.
4. **Touch targets:** minimum 44×44px on buyer/supplier responsive views;
   40px permitted in admin dense tables (desktop pointer assumption).
5. **Forms:** labels always visible (no placeholder-as-label); errors are
   text + icon adjacent to the field, not colour-only borders; required
   fields marked textually.
6. **Motion:** transitions ≤ 200ms, opacity/transform only; respect reduced-
   motion preferences; no parallax or auto-playing movement in portals.
7. **Language:** UI copy in plain English (phase 1), sentence case
   throughout — ALL-CAPS reserved for small eyebrow labels with widened
   tracking, which are decorative duplicates of accessible text.

## 2. Spacing & Layout

- **Base unit 4px.** Scale: `space.1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=20 ·
  `6`=24 · `8`=32 · `10`=40 · `12`=48 · `16`=64 · `20`=80 · `24`=96.
- **Density modes:** `comfortable` (buyer/public: 16–24px paddings, 48px row
  height) and `dense` (admin/supplier tables: 8–12px paddings, 36–40px row
  height). A screen declares one mode; mixing densities inside one table is
  prohibited.
- **Page grid:** 12-column, 24px gutter desktop; max content width 1280px in
  portals (dashboards may go fluid to 1536px); public site sections may run
  full-bleed with a 1200px text measure.
- **Vertical rhythm:** section spacing in portals is `space.8` (32px);
  related-group spacing `space.4` (16px); label-to-field `space.2` (8px).

## 3. Borders, Radii & Shadows

| Token | Value | Use |
|---|---|---|
| `border.hairline` | 1px `neutral.200` | Default divider/boundary everywhere |
| `border.strong` | 1px `neutral.400` | Input borders, emphasized boundaries |
| `border.active` | 2px `ember-deep` | Focus, selected states |
| `radius.none` | 0 | Tables, full-bleed panels, images in marketing crops |
| `radius.sm` | 2px | Buttons, inputs, chips — the default radius |
| `radius.md` | 4px | Modals, dropdown menus, cards (maximum radius in the system) |
| `shadow.none` | — | Default. Flat surfaces separated by hairlines |
| `shadow.raised` | 0 1px 2px rgba(13,27,36,0.10) | Sticky headers, dropdowns |
| `shadow.overlay` | 0 8px 24px rgba(13,27,36,0.16) | Modals, drawers only |

Doctrine: **two shadow levels, nothing floats without a reason.** Cards exist
only where a surface genuinely detaches from the page (modals, menus,
drag states) — content on the page is structured with hairlines and spacing,
not boxed into rounded cards.

## 4. Responsive Standards

Breakpoints (min-width): `sm` 480 · `md` 768 · `lg` 1024 · `xl` 1280 ·
`2xl` 1536.

| Surface | Commitment (from UI-PREPARATION-PLAN §7) |
|---|---|
| Public site | Fully responsive, mobile-first |
| Buyer portal | Fully responsive; tables collapse to stacked key-value cards below `md`; checkout single-column below `lg` |
| Supplier portal | Responsive to tablet; phone-optimized for: requirement alerts, quote status, PO acknowledgement, delivery-proof upload (camera capture) |
| Admin portal | Desktop-first (`lg`+); functional at `md`; no phone commitment phase 1 |

Rules: layout reflows — components never swap meaning across breakpoints;
filters move into a drawer below `lg`; sticky table headers and sticky
primary actions on long forms at all widths; wide tables scroll horizontally
within their own container, never the page.

## 5. Design Tokens (canonical names)

Naming: `category.group.variant` — stable across any future implementation.

- **Colour:** `color.brand.{ink|ink-2|ember|ember-deep|paper|chalk}` ·
  `color.neutral.{100…900}` · `color.semantic.{success|warning|danger|info}`
  (+ `.tint` each) — values in VISUAL-IDENTITY.md §2.
- **Type:** `font.family.{display|body|mono}` ·
  `font.size.{12|13|14|16|18|21|26|33|42|56}` ·
  `font.weight.{regular|medium|semibold|bold}` ·
  `font.lineheight.{tight:1.1|heading:1.25|body:1.5|dense:1.4}` ·
  `font.numeric.tabular` (mandatory in all data tables and money).
- **Space:** `space.{1…24}` per §2. **Radius:** `radius.{none|sm|md}`.
  **Border:** `border.{hairline|strong|active}`.
  **Shadow:** `shadow.{none|raised|overlay}`.
- **Motion:** `motion.fast` 120ms · `motion.base` 180ms · ease-out standard.
- **Z-layers:** `layer.{base:0|sticky:10|dropdown:20|overlay:30|toast:40}`.

Governance: tokens are the single styling vocabulary. A component may not
introduce a raw hex/px value that has no token; new tokens are added here
first, then used.

## 6. Component Styling Principles

For the shared component inventory defined in UI-PREPARATION-PLAN.md §5:

1. **Buttons:** primary = Ember Deep fill, white text (AA), `radius.sm`;
   secondary = Chalk fill + `border.strong`, Ink text; tertiary = text-only
   Ink with underline on hover; destructive = semantic danger fill. One
   primary per view. Height 40px (dense) / 44px (comfortable).
2. **Status chips:** tint background + deep semantic foreground + label
   (+ icon); `radius.sm`; identical status vocabulary across all portals —
   one lifecycle, one colour, one word, everywhere (the chip system is the
   brand's most-seen component).
3. **Tables:** Chalk surface, hairline row dividers, `neutral.100` zebra
   optional in dense mode, sticky header with `shadow.raised`, tabular
   numerals right-aligned for numbers/money, mono for reference IDs, row
   hover `neutral.100`. No rounded corners.
4. **Forms:** visible labels above fields; 1px `border.strong` inputs on
   Chalk, `radius.sm`; focus per §1.3; inline validation on blur; multi-step
   forms (registration, checkout) show a numbered progress rail.
5. **Money & GST display:** amounts always ₹ + two decimals, tabular; the
   GST-breakdown block (taxable value → GST → total, per OBD-20) is a single
   reusable component rendered identically at checkout, order detail and
   invoice preview.
6. **Approval queues:** list + detail + decision bar is one pattern
   (suppliers, buyers, payment proofs, cost proposals) — decision actions
   fixed bottom-right of the detail pane, reason fields mandatory on
   negative actions.
7. **Dashboards:** stat tiles are flat Chalk panels with hairline borders —
   figure (26px tabular), label (13px), delta where meaningful; every tile
   links to its filtered list (ADM-019 AC1). Chart design follows the
   dataviz guidance at build time, recoloured with brand tokens.
8. **Empty states:** line illustration (icon style), one sentence, one
   action. Never a bare "No data".

## 7. Quality Gates

A screen design is "on system" only if: tokens only (no ad-hoc values) ·
contrast pairs verified · one primary action · status = colour + word ·
density mode declared · responsive behaviour specified at all committed
breakpoints · matches the portal's principles in PORTAL-PRINCIPLES.md.
