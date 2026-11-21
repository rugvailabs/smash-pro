# ADR-0011 — Product cost-price entry (`products.mrpPaise`, purchase/margin columns)

> Status: Accepted (owner-directed, OBD-23) · Date: 2026-11-20
> Amended 2026-11-20: margin base corrected from MRP to Dealer/Purchase Price (see Amendment below).

## Context

OBD-23 replaces the Add Product form's single "standard listed price" entry
with a cost-based entry: MRP, plus Dealer/Purchase Price and ProSmash Margin
(each % of MRP or fixed ₹), resolving to the visitor selling price and a
live Visitor Discount % preview. `products.stdPaise` (the existing
visitor-selling-price column every pricing/display path already reads —
`server/pricing.ts`, cart/checkout, public catalogue) is unchanged in name
and meaning; only how admin *arrives at* its value on creation changes.

## Decision

- Add nullable columns to `products` (nullable because existing rows predate
  this entry mode and keep working with `stdPaise` set directly):
  `mrpPaise`, `purchaseMode` (`'percent'|'fixed'`), `purchaseValue`
  (raw entry, `doublePrecision`), `purchasePaise` (resolved),
  `marginMode`, `marginValue`, `marginPaise`.
- Shared pure math lives in `src/lib/pricing-calc.ts`
  (`resolveToPaise`, `visitorDiscountPct`) — imported by both the client
  form (live preview) and `createProduct()` (authoritative resolution), so
  the two never drift. The server **recomputes from the raw MRP/purchase/
  margin inputs**; it never trusts a client-submitted total, matching the
  price-isolation posture already used for buyer pricing.
- Percent mode for *both* Purchase Price and Margin resolves against
  **MRP**, not against purchase price — flagged as an assumption in OBD-23
  for owner confirmation.
- `stdPaise = purchasePaise + marginPaise`, asserted against the existing
  `assertStd` bounds (₹0.01–₹10,00,000) before insert.
- Visitor Discount % floors at 0 (`visitorDiscountPct`) — a resolved price
  at or above MRP never displays as a negative discount.
- Purchase/margin columns are **never added to `PricedProduct`** (the
  public/buyer API DTO in `server/pricing.ts`) — same OBD-05 admin-only
  boundary as before; only `AdminProductRow`/audit log may surface them.
  **MRP is the one exception (OBD-23 amendment, 2026-11-20, ADR-0011
  unchanged otherwise): it IS added to `PricedProduct.mrp`** — a public
  marketing figure, not a cost/margin figure, so it carries no
  access-boundary restriction. See ADR note in `server/pricing.ts`.
- Scope: the Add Product form only. `updateProduct()` and bulk-catalogue
  reprice continue to set `stdPaise` directly; they are not retrofitted to
  this cost-entry model here.

## Consequences

- New products carry a full cost breakdown (MRP, purchase, margin) for
  Super-Admin visibility/audit; products created before this change keep
  `null` in the new columns with `stdPaise` as their only price fact.
- Approved-buyer category pricing (`buyerTypeDiscountBp` /
  `/admin/pricing`) is untouched — it still discounts off `stdPaise`
  exactly as before.
- If the owner's answer to the flagged assumption is "margin should be a
  markup on purchase price, not MRP," only `resolveToPaise`'s margin call
  site needs to change (pass `purchasePaise` instead of `mrpPaise` as the
  base) — the column shapes and UI do not need to change.

## Amendment (2026-11-20) — margin base corrected to Dealer/Purchase Price

The owner confirmed the flagged assumption the other way: **ProSmash Margin
is a markup on Dealer/Purchase Price, not on MRP.** Purchase price's own %
mode is unchanged (still % of MRP) — only the margin side moves.

- `margin_amount = dealer_price × (margin_percentage / 100)` when
  `marginMode = 'percent'`; unchanged (`marginValue` in paise) when
  `marginMode = 'fixed'` — a fixed ₹ amount never depended on a base, so it
  was already "on top of" Dealer Price via `stdPaise = purchasePaise +
  marginPaise`.
- `visitor_selling_price = dealer_price + margin_amount` — unchanged
  (`stdPaise`, same formula, only `marginPaise`'s own resolution changed).
- `visitor_discount_percentage = (MRP − visitor_selling_price) / MRP` —
  unchanged; still computed against MRP (`visitorDiscountPct`), per OBD-23.
- Implementation: `resolveToPaise`'s margin call site (`createProduct` in
  `server/admin.ts`, and the client live-preview in
  `components/admin-product-form.tsx`) now passes `purchasePaise` as the
  base instead of `mrpPaise`. `resolveToPaise` itself is unchanged (it was
  already base-agnostic — only the caller's choice of base moves).
- No schema migration: `purchaseMode`/`marginMode`/`purchaseValue`/
  `marginValue`/`purchasePaise`/`marginPaise`/`mrpPaise` columns, their
  types and stored enum values (`'percent'|'fixed'`) are unchanged — only
  the *meaning* of `marginMode = 'percent'` changes (its base), which is
  purely an application-layer resolution rule, not a stored fact. Existing
  rows with `marginMode = 'percent'` were created under the old (MRP-based)
  reading; no backfill is performed because `marginPaise`/`stdPaise` were
  already resolved and stored at creation time and are not recomputed
  retroactively.
- Buyer-facing / public contract is unchanged: purchase price and margin
  stay admin-only; only MRP, visitor selling price (`stdPaise`) and the
  MRP-relative discount are ever public (OBD-23).
- Scope is still the Add Product form only — `updateProduct()` and
  bulk-catalogue reprice are unaffected by this amendment, same as the
  original decision.
