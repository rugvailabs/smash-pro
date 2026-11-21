# ADR-0014 — Product HSN code / GST % as admin-entered record-keeping fields

> Status: Accepted (owner-directed) · Date: 2026-11-20

## Context

CLAUDE.md and OBD-11/OBD-20 block implementing GST rates/HSN classification
without professional tax validation. The owner asked for HSN Code and GST
Percentage fields on products anyway, but — when the conflict with that
policy was raised — explicitly scoped the request down: these are plain
admin-entered data fields, manually typed, never auto-assigned, and **not**
wired into any checkout/invoice/pricing calculation. OBD-11 and OBD-20
remain open; this ADR does not resolve them.

## Decision

- `products.hsn` (pre-existing nullable `text` column, previously hard-coded
  to `null` in `createProduct`) is now admin-settable.
- New nullable column `products.gstPercent` (`doublePrecision`, 0–100,
  2-decimal precision) stores an admin-entered GST rate.
- Both fields are **optional** — null until an admin supplies them — and
  **manually entered only**; nothing in the system infers, assigns, or
  looks up a value for either field.
- Validation is format/range sanity-checking only, never a tax
  classification decision:
  - HSN: trimmed, must be 4–8 digits if non-empty (standard HSN/SAC code
    length) — `normalizeHsn` in `src/lib/product-tax-fields.ts`.
  - GST %: must be 0–100 if present — `normalizeGstPercent`, same module.
  - Both pure functions are shared between `server/admin.ts` (authoritative
    server-side resolution, same price-isolation posture as
    `pricing-calc.ts`) and their unit tests — no DB/session dependency.
- **Not wired into any calculation.** `stdPaise`/`purchasePaise`/
  `marginPaise` (OBD-23/ADR-0011) are computed exactly as before; GST % is
  not read when resolving them. Cart, checkout, order, and invoice GST
  presentation (`server/pricing.ts`, `server/buyer.ts`, `checkout-view.tsx`,
  `buyer-ui.tsx`) are unchanged and untouched by this ADR.
- **Admin-only, same boundary as Dealer Price/margin.** Neither field is
  added to `PricedProduct` (`server/pricing.ts`) or any buyer/visitor-facing
  API shape — only `AdminProductRow` (`lib/admin-types.ts`) carries them,
  and every read/write path requires `requireAdmin()`/`adminSession()`,
  same as the rest of `server/admin.ts`.
- Surfaced in the Add Product form (optional "Tax reference" fields, not
  wired into the live pricing preview) and the Products table (an inline
  "HSN / GST" edit cell, `HsnGstCell` in `admin-catalog-controls.tsx`,
  PATCHing both fields together via the existing `updateProduct` route).

## Consequences

- No migration-breaking change: `hsn` already existed and was already
  nullable; `gstPercent` is a new nullable column, so existing rows keep
  `gstPercent = null` with no backfill needed (`npm run db:push` applies
  the new column — no committed migration file, consistent with how
  ADR-0011's columns were added).
- OBD-11/OBD-20 (GST rates/HSN classification validity, CGST/SGST-vs-IGST,
  invoice compliance, rate-correctness) remain fully open and
  `PENDING CONFIRMATION` — this ADR only adds a place to record a value an
  admin believes is correct; it does not validate, apply, or compute GST
  anywhere.
- If/when OBD-11/OBD-20 resolve with professional tax validation, a future
  change can start reading `products.gstPercent`/`hsn` into actual GST
  computation — these columns are deliberately shaped to support that
  later without another migration, but doing so is explicitly out of scope
  here.
