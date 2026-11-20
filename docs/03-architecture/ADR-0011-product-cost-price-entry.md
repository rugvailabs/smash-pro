# ADR-0011 — Product cost-price entry (`products.mrpPaise`, purchase/margin columns)

> Status: Accepted (owner-directed, OBD-23) · Date: 2026-11-20

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
- Purchase/margin/MRP columns are **never added to `PricedProduct`** (the
  public/buyer API DTO in `server/pricing.ts`) — same OBD-05 admin-only
  boundary as before; only `AdminProductRow`/audit log may surface them.
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
