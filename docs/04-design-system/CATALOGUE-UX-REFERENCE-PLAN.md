# ProSmash — Catalogue & Shopping UX Reference Plan

> Status: **Draft for owner review — NOT approved.** No implementation,
> migration, commit, push or deploy happens against this plan until the
> owner signs off on §8.
> Context: owner request to use Decathlon as a **UX/visual reference** for a
> premium sports-retail shopping experience inside the existing ProSmash B2B
> buyer portal/public site — not a new B2C property, not a literal clone.
> Related: CLAUDE.md, OPEN-BUSINESS-DECISIONS.md, VISUAL-IDENTITY.md,
> DESIGN-STANDARDS.md, PORTAL-PRINCIPLES.md, UI-PREPARATION-PLAN.md,
> ASSET-ACQUISITION-PLAN.md.

## 1. Purpose and scope

Raise the public site and Business Buyer Portal's catalogue/shopping screens
to a premium, category-leading retail *functional* standard — navigation,
discovery, filtering, product detail, cart/checkout polish — while:

- Keeping the ProSmash **B2B operating model unchanged** (institutional
  buyers, approval-gated pricing, 100% advance payment, existing cart/
  checkout/auth/order workflows).
- Keeping the **Court Ink** visual identity as the only skin — no literal
  reproduction of a named competitor's layout, trade dress or assets.
- Touching **only** public + buyer-portal screens. Admin and Supplier
  portals are explicitly out of scope and will not be redesigned.

## 2. What already exists — do not rebuild

The buyer-facing catalogue is considerably more mature than a bare
scaffold. Confirmed in this inspection:

| Capability | File(s) | Notes |
|---|---|---|
| Image-led mega menu (Shop by Sport / Shop by Equipment / Popular) | `components/mega-menu.tsx`, `lib/nav-catalogue.ts` | Desktop hover panel + mobile accordion, role-agnostic |
| Homepage: hero carousel, category grid, featured pricing, process rail, supplier band | `app/page.tsx`, `components/hero-carousel.tsx` | 16° section-cut motif, Ken-Burns hero (per recent commits) |
| Category listing: hero band, category strip, sidebar filters (equipment type, price band), toolbar (sort/count), responsive grid | `app/catalog/page.tsx`, `components/category-hero.tsx`, `category-strip.tsx`, `catalog-sidebar.tsx`, `catalog-toolbar.tsx` | One shared component set across all 12 categories |
| Product card & grid: role-aware price block, real discount badge (computed, never hardcoded), wishlist (localStorage), add-to-cart | `components/product.tsx` | |
| Product detail: gallery, breadcrumb, role-aware price, specs table, configurator (racquet stringing), cross-sell ("often procured together") | `app/product/[sku]/page.tsx`, `components/product-gallery.tsx`, `configurator.tsx` | |
| Cart / checkout / orders / payments | `components/cart-view.tsx`, `checkout-view.tsx`, `order-detail.tsx`, `payment-demo.tsx` | Built around OBD-05/08/20/21 decided rules |
| Pricing & role gating | `server/pricing.ts`, `components/role-gate.tsx` | Public standard price vs. approved-buyer discounted price (OBD-03) |

This is already functionally aligned with mainstream premium sporting-goods
e-commerce UX (image mega-menu, filterable category grids, galleried PDP,
cross-sell). The gap to close is **refinement and completeness**, not a
from-scratch rebuild.

## 3. Conflicts from the original request — resolved

The initial request ("recreate the Decathlon website as closely as
possible," "the same recognisable Decathlon shopping experience") was
flagged for two conflicts, now resolved by the owner:

1. **Business model** — clarified: this stays inside the existing ProSmash
   B2B buyer portal. Public visitors browse at standard prices; approved
   buyers see their institutional discount; pending buyers cannot order.
   No consumer-only features, no change to the wholesale purchasing model.
2. **Literal cloning** — clarified: Decathlon is a **UX/visual reference
   only**. The deliverable must remain independently identifiable as
   ProSmash, built on Court Ink tokens, and must not reproduce Decathlon's
   distinctive trade dress or use its proprietary assets without verified
   rights.

This plan proceeds on that basis.

## 4. Hard blockers — must clear before implementation

### 4.1 Catalogue content authorization

The owner's brief says "same product catalogue and product information
where we have verified authorisation to use those assets." Today:

- `web/src/data/products.ts` is explicitly labelled **sample/illustrative**
  data — no brand names (withheld pending authorization, per its own
  header comment).
- `assets/products/<category>/` holds exactly **one representative,
  CC-licensed image per category** (12 total) — not a real catalogue.
- `assets/references/` is empty, and per CLAUDE.md is internal-inspiration
  only and must never ship.
- No `LICENSES.md` exists yet recording rights to any third-party catalogue
  content (the convention is established for `brand/fonts/` and
  `assets/*` generally in ASSET-ACQUISITION-PLAN.md §5).

**Before any real product data or imagery is imported:** the owner provides
the actual license/authorization document(s) naming ProSmash/Smash Pro as a
permitted user of specific Decathlon-sourced catalogue content, and a
`LICENSES.md` entry is recorded for each asset before it enters `assets/`.
Until that exists, the catalogue stays on labelled sample data — per
CLAUDE.md's standing rule against placeholder or unauthorized product
imagery. This is a go/no-go gate, not a design task.

### 4.2 IP / trade dress boundary

Regardless of catalogue licensing, the **site design itself** will not
replicate Decathlon's specific layout, section sequencing, or visual
signature closely enough to be read as "the Decathlon experience" under a
different name. Study is for functional patterns (information architecture,
filter/sort mechanics, PDP structure) expressed entirely through Court Ink
tokens and existing ProSmash components. No Decathlon screenshots,
markup, CSS, copy, or imagery are copied into the codebase.

### 4.3 Open business decisions that still gate real commerce

Per `OPEN-BUSINESS-DECISIONS.md`, these remain genuinely undecided and will
**not** be invented to make the redesign "complete":

- **OBD-02** — buyer/supplier verification requirements (◇ proposed, not approved).
- **OBD-09** — MOQ / minimum order value rules (affects cart/checkout UI, D3).
- **OBD-11 / OBD-20(c,f,g)** — GST rates, HSN, CGST/SGST-vs-IGST, invoice
  compliance — requires tax-professional validation, never team-invented.
- **OBD-20(a,b)** — actual discount percentages and the "buyer category"
  definition.
- **P-06 (D2)** — stock display precision to buyers.

Where the UX plan below touches these areas, it will build to the
`PENDING CONFIRMATION` placeholders already in the codebase (see e.g. the
"illustrative sample pricing" notes in `product/[sku]/page.tsx`), not
resolve them.

## 5. UX pattern study — functional targets, not visual copy

Patterns to study from category-leading sporting-goods retail (Decathlon
among them) and express through **existing Court Ink components**:

| Area | Functional pattern to adopt | Already present? |
|---|---|---|
| Navigation | Deep sport → sub-category → equipment-type taxonomy in the mega menu; sticky header on scroll | Partial — mega menu exists; taxonomy depth/breadth can extend |
| Homepage | Editorial category entry points, seasonal/featured rails, clear value proposition band | Present, simpler than target |
| Listing | Faceted filters (type, price — extend to size/spec where real data supports it), sort, result count, empty/zero-state handling | Present (type + price); more facets need real spec data first |
| PDP | Multi-image gallery with zoom, sticky buy box, full specs, cross-sell, breadcrumb | Present; zoom/pinch and richer gallery interaction are gaps |
| Cart/checkout | Line-item editing, address management, GST breakdown, payment-method selection | Present per OBD-05/08/20/21 — scope is polish, not rebuild |
| Search | Autocomplete/suggestions | `api/suggest/route.ts` and `search-box.tsx` exist — extend, don't replace |

No homepage banner carousel, section order, or page structure will be
copied wholesale from any single competitor site; each pattern is
implemented as its own Court Ink-native composition.

## 6. Proposed phased approach (pending approval)

1. **Phase 0 (this document):** owner review and decision on §8.
2. **Phase 1 — gap list:** screen-by-screen audit of B3–B14 (catalog,
   PDP, cart, checkout, orders) against the functional targets in §5;
   produce a concrete punch list (no visual mockups of a competitor).
3. **Phase 2 — component refinement:** extend existing components (gallery
   zoom, richer filter facets contingent on real spec data, search
   autocomplete surfacing) on current tokens; no new design system.
4. **Phase 3 — catalogue data:** only after §4.1 clears, replace sample
   `products.ts` rows category-by-category with authorized data, imagery
   licensed and logged per ASSET-ACQUISITION-PLAN.md §5.
5. Each phase gets its own approval checkpoint before code changes land,
   per CLAUDE.md working rule #5.

## 7. Explicitly out of scope

- Admin Portal and Supplier Portal screens — untouched.
- Database schema, migrations, pricing engine, auth, order/payment logic —
  untouched; this is presentation-layer work only.
- Any new business rule (MOQ, GST, verification, discount %) — remains
  `PENDING CONFIRMATION`, never inferred from Decathlon's behaviour as a
  substitute for an owner decision.
- Literal Decathlon imagery, copy, markup, or CSS — never imported.

## 8. Decisions needed from the owner before Phase 1 starts

1. Confirm the phased approach above, or redirect scope/sequencing.
2. Provide (or confirm timeline for) actual licensing/authorization proof
   for any Decathlon-sourced catalogue content — or confirm the catalogue
   proceeds on independently-sourced/commissioned assets per
   ASSET-ACQUISITION-PLAN.md instead.
3. Confirm no objection to the IP boundary in §4.2 (functional reference
   only, no trade-dress reproduction).
