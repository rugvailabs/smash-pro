# ADR-0012 — Brand master list + purchase-order brand resolution

> Status: Accepted (owner-directed) · Date: 2026-11-20

## Context

The owner asked for a Brand column on the Purchase Orders table (`/admin/pos`),
positioned between Item and Qty, auto-populated from "the selected product's
Brand Management record" rather than typed per purchase. Neither a Brand
Management module nor a per-row product-selection step existed anywhere in
the codebase before this change:

- `products` had no brand field at all.
- Purchase orders are created from an **awarded quotation** against a
  **requirement** (`requirements.title`/`catSlug`/`qty` — free text and
  category, never a catalogue SKU); `createPo()` copied `req.title` straight
  into `purchaseOrders.lineName`. There was no point in that pipeline where
  an admin picks an actual catalogue product.

This is not a pricing/commercial policy decision (no OBD entry) — it's an
operational catalog/procurement data model addition, decided directly by the
owner's explicit instruction.

## Decision

- New `brands` table: `id`, `name` (unique), `notes`, `createdAt`. A simple
  master list — name typed once, ever, here. New `/admin/brands` page
  (list + add form) under the Catalogue nav group.
- `products.brandId` (nullable FK → `brands.id`) — set once per product in
  the Add Product form (a `<select>` of existing brands; "No brand" stays
  valid for products predating this feature or without one).
- `purchaseOrders.sku` (nullable FK → `products.sku`) — **new, optional**
  product-selection point added to the `IssuePo` panel (Sourcing → award →
  issue), since that's the only place in the existing pipeline where a PO
  row is actually written. The dropdown lists products filtered to the
  requirement's category for relevance; picking one is purely informational
  — it never changes `unitPaise`/`valuePaise`/`lineQty`/terms, which still
  come exclusively from the quotation, per the owner's "keep pricing,
  discount and GST calculations unchanged" instruction.
- `/admin/pos` resolves Brand server-side via `po.sku → products.brandId →
  brands.name` (a map built once per request, same pattern as the existing
  `orgName` supplier-name lookup in `posForAdmin()`) — never stored
  redundantly on the PO row, so renaming/reassigning a brand is reflected
  immediately everywhere.
- Brand filter on `/admin/pos` is a server-rendered GET form (`?brand=`),
  matching the existing Audit Log filter pattern — no client JS required.
- "Line" (a single cell combining item + qty) is split into separate
  **Item** and **Qty** columns, with **Brand** inserted between them, in
  both the main table and the "Working queue" per-PO cards.

## Consequences

- Historical POs (and any PO issued without picking a product) show
  Brand "—" — expected, not a bug; nothing retroactively links them.
- Admins can still issue a PO without linking a product at all (the
  dropdown defaults to "Not linked") — linking is additive, never required,
  so this doesn't block the existing award → issue flow for
  category-only requirements with no exact catalogue match.
- Brand is not retrofittable on existing products from any UI yet — only
  the Add Product form sets it (same "Add Product form only" scope
  decision as ADR-0011's cost-based pricing entry). A bulk/edit path can be
  added later if the owner wants to backfill brands on the existing catalog.
