# ADR-0009 — Buyer delivery method (`orders.deliveryMethod`)

> Status: Accepted (owner-directed, OBD-22) · Date: 2026-11-20

## Context

OBD-22 confirms three delivery options for warehouse-fulfilled buyer orders:
self-pickup, self-arranged courier, or free Smash-Pro-managed delivery
(only offered at/above a ₹50,000 GST-inclusive items total). None of these
carry a shipping charge to the buyer, which removes the previous flat
illustrative shipping fee (`DEMO_SHIPPING_PAISE`, ₹1,200) that `cartForSession()`
applied to every non-empty cart.

Supplier direct-shipment lines are unaffected — OBD-19's existing
admin-set-per-order shipping charge continues unchanged for those.

## Decision

- Add `orders.deliveryMethod: text` — `'managed' | 'self-pickup' | 'self-courier'`,
  not null, DB-level default `'managed'` only so the migration doesn't break
  existing seeded rows; the application always passes an explicit value —
  `createOrderFromCart()` never relies on the column default.
- Add `orders.pickupNote: text` — nullable; set to the (placeholder) warehouse
  address snapshot only when `deliveryMethod = 'self-pickup'`, so a later
  address change never rewrites historical orders.
- `FREE_DELIVERY_THRESHOLD_PAISE = 50_000_00` (₹50,000) lives in
  `server/buyer.ts` next to the pricing logic it gates.
- `cartForSession()` no longer charges a flat shipping fee; it now exposes
  `freeDeliveryEligible: boolean` (`itemsIncl >= threshold`) so the client
  can show eligibility before the buyer picks a method. `shipping` in the
  cart DTO is always `0` for warehouse-fulfilled lines under this model.
- `createOrderFromCart()` takes a required `deliveryMethod` argument,
  re-validates eligibility server-side (never trusts the client — a request
  for `'managed'` below the threshold is rejected with 400), and persists
  `deliveryMethod`/`pickupNote`. `shippingPaise` is always `0` for the
  warehouse-fulfilled portion.
- `PICKUP_ADDRESS_PLACEHOLDER` is a single hardcoded constant marked
  `PENDING CONFIRMATION` (OBD-22) — not a database table, since there is
  exactly one location and it isn't confirmed yet. Swap the constant for
  the real address once supplied; no schema change needed for that.

## Consequences

- Every new order must carry a `deliveryMethod`; existing seeded demo orders
  need a backfill value (`'managed'`) via the same migration so the
  not-null constraint doesn't break existing rows.
- The checkout UI must compute and show live eligibility as the cart total
  changes, and disable the managed option below the threshold rather than
  letting the server reject it silently.
- GST-breakdown display (`GstCard`) now legitimately shows a `0` shipping
  line for the first time — rendered as "Free" rather than "₹0.00" for
  clarity.
