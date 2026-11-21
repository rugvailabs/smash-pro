# ADR-0016 — Buyer-facing product variant grouping (`products.groupKey`)

> Status: Accepted (owner-directed) · Date: 2026-11-21

## Context

Bulk-importing a supplier stock sheet (LI-NING, HUNDRED) produces many rows
per model — one per colour/size combination (ADR-0015's `color`/`size`
fields). Importing them as independent products would flood the buyer-
facing catalogue with duplicates of the same model. The owner confirmed:
buyers should see **one card, one product page, with a Size/Colour picker**
— not N separate listings.

## Decision

- New nullable column `products.groupKey` (`text`). Rows sharing a
  non-null `groupKey` are ONE buyer-facing listing; each row is still the
  real sellable unit (own `sku`, price, stock, HSN, GST). Null (the
  default, and every pre-existing row) = a standalone, ungrouped product —
  **completely unchanged behaviour** from before this column existed.
- **No separate `product_groups` table.** A flat grouping key directly on
  `products` was chosen over a full parent/variant schema (name/image/
  category/brand hoisted to a shared parent row) to minimise blast radius:
  zero migration of existing rows, zero risk to cart/checkout/orders (which
  already operate on a specific `sku` — a variant IS the sellable unit,
  unchanged), and a much smaller, independently reviewable diff. If a
  genuine need emerges later for group-level shared fields (one name/image
  edited once instead of per-variant), that is a bigger follow-up change,
  not blocked by this one.
- **Listing/search/related-products collapse a group to ONE representative
  row** — the lowest-priced active variant, tagged with `variantCount` —
  via `dedupeGroups` (`src/lib/group-products.ts`, unit-tested, imported by
  `server/catalog.ts`'s `listProducts`/`searchCatalog`/`relatedProducts`).
  `suggestFor` (search-box suggestions) applies the same one-per-group rule.
- **The product detail page is the one place a group expands out.**
  `getProductBySku` attaches every ACTIVE sibling variant (already fully
  role-aware-priced) as `PricedProduct.variants`, so the client-side
  `VariantPicker` (`components/variant-picker.tsx`) can resolve a Size/
  Colour selection to a specific sku and swap price/stock/add-to-cart
  instantly — no extra fetch on selection change.
- **`color`/`size`/`inStock` become PUBLIC** on `PricedProduct`/`Product`
  (previously admin-only per ADR-0015) — a buyer picking options needs to
  see them and know if a combination is in stock. `supplierCode`/`msp`/
  `hsn`/`gstPercent` remain admin-only; this ADR does not change that
  boundary.
- A grouped card's "Add to Cart" is replaced with "Choose options" (routes
  to the product page) since the grid alone can't resolve which colour/size
  a buyer means; a single-variant (ungrouped) card is unaffected.
- `admin.ts` (`createProduct`/`updateProduct`/`productsForAdmin`), the Add
  Product form, the Edit modal, and the Products table all gained a
  `groupKey` field/column — admin/importer is solely responsible for which
  rows share one; never validated against anything beyond length
  (`normalizeGroupKey`, `src/lib/product-catalog-fields.ts`).

## Scope / known v1 simplifications

- Switching the Size/Colour selection updates price, stock status and
  add-to-cart — **not** the page's gallery/name/specs, which stay bound to
  whichever sku the page was loaded with. A full per-variant image swap is
  a reasonable follow-up, not built here.
- The representative card for a group is the **cheapest active variant**;
  it is not guaranteed to be in stock (a buyer may land on a sold-out
  default selection and need to pick another size/colour on the page).
- Cart, checkout, and orders are **unchanged** — a variant is a normal
  `sku` row; `groupKey` is purely a browse/discovery grouping, invisible
  to anything downstream of "which sku is being purchased."
- The bulk importer that will actually populate `groupKey` from a supplier
  stock sheet (deriving it from the base model code) is a separate,
  not-yet-built piece of work — this ADR only lays the grouping
  infrastructure the importer will rely on.

## Consequences

- No migration-breaking change: `groupKey` is nullable, no backfill
  needed; every existing product keeps `groupKey = null` and renders
  exactly as before.
- `GET` catalogue/search/related paths do one extra in-memory grouping
  pass (`dedupeGroups`) over already-fetched rows — no extra DB round
  trip. `getProductBySku` does one extra query only when the requested
  sku is actually grouped.
