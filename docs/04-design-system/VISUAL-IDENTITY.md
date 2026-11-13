# ProSmash — Visual Identity

> Status: ✅ Approved by owner — 2026-11-13 (logo remains at concept level;
> fonts not yet acquired — licensing recorded for the asset-acquisition
> stage) · Last updated: 2026-11-13
> Foundation: BRAND-FOUNDATION.md · Standards: DESIGN-STANDARDS.md

## 1. The Visual Direction — "Court Ink"

One direction, committed:

**Deep ink surfaces, warm paper light, a single ember-orange accent, strong
grotesque typography, and a sharp diagonal graphic language.**

Why this works for ProSmash and nothing generic does:

- **Ink navy as the brand's gravity.** A near-black blue (not corporate
  bright blue, not SaaS purple) reads as institutional, premium and calm —
  the committee-safe backbone.
- **One ember-orange accent carries all the sporting energy.** Heat, medals,
  clay courts, match intensity — used sparingly it electrifies; used
  everywhere it would cheapen. Scarcity is the discipline.
- **Warm paper, not clinical white.** An off-white ground keeps density
  readable for hours and separates ProSmash from sterile admin templates.
- **The diagonal is the brand's motion.** A single consistent angle (16°)
  derived from a smash trajectory appears in section cuts, image crops,
  dividers and the future logo — energy through geometry, not decoration.
- **No gradients, no glassmorphism, no soft floating cards.** Flat planes,
  hairline rules, decisive edges. Premium through restraint.

## 2. Colour Palette

### 2.1 Brand colours

| Token | Name | HEX | Role |
|---|---|---|---|
| `color.brand.ink` | Court Ink | `#0D1B24` | Primary brand dark: marketing surfaces, headers, footers, display text |
| `color.brand.ink-2` | Ink Riser | `#15293A` | Raised panels on ink, hover states on dark |
| `color.brand.ember` | Smash Ember | `#E8481F` | The accent: primary actions, active states, key highlights, brand marks |
| `color.brand.ember-deep` | Ember Deep | `#B23312` | Accent on light backgrounds where AA text contrast is required; pressed states |
| `color.brand.paper` | Paper | `#FAF8F4` | Default app/page background |
| `color.brand.chalk` | Chalk | `#FFFFFF` | Cards, table surfaces, inputs |

### 2.2 Neutral ramp (warm grey)

| Token | HEX | Typical use |
|---|---|---|
| `color.neutral.100` | `#F1EEE8` | Subtle fills, zebra rows |
| `color.neutral.200` | `#E3DFD7` | Hairline borders, dividers |
| `color.neutral.400` | `#A9A294` | Disabled text, placeholders |
| `color.neutral.600` | `#6E675B` | Secondary text, captions |
| `color.neutral.800` | `#3A362F` | Body text on light |
| `color.neutral.900` | `#1E1C18` | Headings on light (alt to Ink) |

### 2.3 Semantic colours

| Token | HEX | Meaning |
|---|---|---|
| `color.semantic.success` | `#1E7A46` | Approved, paid, delivered, in stock |
| `color.semantic.warning` | `#9A6A0B` | Pending verification, nearing timeout, low stock |
| `color.semantic.danger` | `#B3261E` | Rejected, failed, overdue, cancelled |
| `color.semantic.info` | `#1F5F8B` | Informational states, neutral notices |

Each semantic colour gets a paired tint for fills (success `#E6F2EB`, warning
`#F8F0DC`, danger `#F9E7E5`, info `#E5EFF6`) — chips and banners use tint
background + deep foreground, never saturated backgrounds with white text.

### 2.4 Usage rules

1. **Ember is rationed.** Per screen: one primary action, active nav item,
   and genuine highlights — nothing else. If ember appears more than ~5 times
   in a viewport, the hierarchy is broken.
2. **Ember is never body text** (3.5:1 on white fails AA). On light
   backgrounds, text and icons that must read orange use **Ember Deep**.
   White text sits on Ember Deep or Ink, not on Smash Ember at small sizes.
3. **Ink is for brand moments and chrome** (marketing hero, portal header,
   footer); the working canvas of all portals is **Paper** with **Chalk**
   surfaces. No dark-mode commitment in phase 1.
4. **Status is always colour + word/icon** — never colour alone (see
   DESIGN-STANDARDS.md accessibility).
5. Semantic colours never substitute for brand colours or vice versa: ember
   means "act/active", green means "succeeded". An ember "success" is a bug.
6. No gradients anywhere in UI. The single permitted exception: a photographic
   ink overlay (see §7) for image legibility.

## 3. Typography

All recommended families are open-source (SIL OFL) — licensing records go in
`brand/fonts/LICENSES.md` when files are added. Final licensing check happens
at adoption; these are brand recommendations, not a technology selection.

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display & headings | **Archivo** (incl. Expanded widths) | 500–700 | The brand's voice: a sturdy grotesque with athletic width variants. Display sizes use Archivo Expanded SemiBold, tight line-height (1.1), slight negative tracking. ALL-CAPS only for small labels/eyebrows, +6% tracking. |
| Body & UI | **Inter** | 400–600 | Workhorse for paragraphs, controls, tables. Line-height 1.5 body, 1.4 in dense tables. |
| Numbers & dashboard data | **Inter — tabular lining figures** | 400–600 | All quantities, currency, stock figures, table numerics use `tnum` so columns align. ₹ amounts always two decimals (OBD-20). |
| Reference IDs & code-like data | **IBM Plex Mono** | 400–500 | Order/PO/requirement/GSTIN identifiers — instantly scannable, copy-safe. Used small and sparingly. |

Type scale (desktop base 16px): 12 · 13 · 14 · 16 · 18 · 21 · 26 · 33 · 42 ·
56. Portals top out at 26–33; only the public site uses 42–56. One scale,
different ceilings per surface.

## 4. Logo Direction (concept only — no artwork yet)

**A customized wordmark: "PROSMASH" set in a modified heavy grotesque, with
one engineered gesture — the smash cut.**

- All seven letters stand upright and solid — the institutional body.
- A single **16° diagonal cut** slices through the counter of the final "A"
  or the crossbar of the "H" (to be explored), creating the trajectory of a
  downward smash — the one athletic gesture in an otherwise composed mark.
- **Monogram**: a "P" carrying the same 16° cut, for favicons, app icons and
  small-space use.
- Colourways: Ink on Paper (primary), Chalk on Ink (reverse), single-colour
  Ember version reserved for brand moments. Never multi-colour, never
  gradient, never outlined.
- No swooshes, balls, shuttlecocks, or figure-in-motion clichés. The sport is
  in the cut and the name, not in clip-art.

Clear space: height of the wordmark "O" on all sides. Minimum sizes and
misuse sheets are produced with the final artwork (a later task, stored under
`brand/logos/`).

## 5. Iconography

- **Style:** stroke icons, 1.75px stroke at 24px grid, squared terminals,
  corner radius ≤ 2px — sharp, engineered, matching the graphic language.
  No filled blobs, no duotone, no rounded-friendly styles.
- **Grid:** 24px master grid, 16px compact variant for dense tables.
- **Colour:** `neutral.600` default, `ink` active, `ember-deep` only when the
  icon *is* the action. Semantic icons use semantic colours.
- **Domain set to commission:** sport-category glyphs for the 12 categories
  (cricket, football, basketball, volleyball, badminton, tennis, athletics,
  gym-fitness, indoor, outdoor, sportswear, accessories) drawn in this exact
  style — stored in `assets/icons/`, named `ic-{name}.svg` per the asset
  inventory.

## 6. Graphic Language

- **The 16° diagonal** is the only decorative device: section cuts on the
  public site, image crop edges, the underline of active states in marketing
  contexts, hairline motif on report headers. In portals it appears at most
  once per screen (e.g. page-header rule). Always the same angle.
- **Hairline rules** (`neutral.200`, 1px) structure layouts — tables,
  summaries and section breaks are divided by lines, not floated cards.
- **Flat colour planes** (Ink / Paper / Chalk) create depth through value
  contrast, not shadows.
- **No decorative illustration.** Empty states and onboarding use restrained
  line illustrations in the icon style (stroke, 16° accents, one ember
  highlight) — specified in `assets/illustrations/`; cartoon athletes are
  prohibited.

## 7. Photography & Sports Imagery

Photography is where the sporting soul lives — it must be excellent or absent.

1. **Subjects:** real training and play in Indian institutional contexts —
   school teams at practice, academy drills, college courts; and disciplined
   equipment studies (racquets strung, cricket kit laid out, warehouse racks).
   People are athletes and staff at work, never posed stock models
   high-fiving.
2. **Treatment:** natural directional light, high contrast, true colour with
   a slightly deepened shadow floor. Optional brand treatment for marketing
   surfaces: a flat **Ink overlay at 55–70%** behind display type — the only
   permitted "gradient-like" effect, and it is flat, not graded.
3. **Crop:** dynamic crops honouring the 16° diagonal; motion enters the
   frame, it is not faked with blur filters.
4. **Product imagery:** catalogue products on Chalk or light-grey seamless,
   consistent angle set per category (per ASSET-INVENTORY.md conventions);
   no lifestyle compositing on product detail pages.
5. **Prohibited:** cartoon/3D-render athletes, neon-tinted gym stock, US-only
   sports contexts as defaults, watermarked or AI-artifact imagery.

## 8. Relationship to Assets

This document governs future content of `brand/` (logos, fonts, guidelines)
and `assets/` (banners, category images, icons, illustrations). Nothing is
generated or placed until artwork is approved — per CLAUDE.md, no placeholder
logos or product images, ever.
