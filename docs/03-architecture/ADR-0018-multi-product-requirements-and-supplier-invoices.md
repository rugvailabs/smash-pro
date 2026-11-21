# ADR-0018 — Multi-product requirements, itemized quoting, and supplier invoice records

> Status: Accepted (owner-directed) · Date: 2026-11-21

## Context

The admin "New requirement" form (Workflow C) only ever accepted one
title/category/quantity per requirement — the owner asked to raise a
requirement covering several products in one publish. Separately, the owner
asked for a way to record the supplier's own tax invoice for a fulfilled
purchase order (reusing the structure of three real supplier invoices on
file) with a sent/draft status and a download option.

A related bug was found and fixed in the same pass: the supplier
requirement detail page (`/supplier/requirements/[id]`) 404'd for any
admin-created requirement, because it hard-required a non-empty `spec`
array that the admin form never populated (spec only existed on seeded demo
data), and otherwise rendered hard-coded placeholder status/deadline text
instead of the requirement's real `status`/`closes`.

## Decision

### Multi-product requirements

- `requirements.items` — new nullable `jsonb` column,
  `{ title, catSlug, qty }[]`. `requirements.title`/`catSlug`/`qty` stay a
  **derived summary** (first item's title when there's one item,
  `"{title} + N more"`/`"N products"` when there are several; `catSlug` is
  always `items[0].catSlug`, never a synthetic "mixed" value, so the
  existing FK and every list/filter that reads these three columns keeps
  working unchanged). `items` is the source of truth once present; null for
  requirements predating this field (treated as single-item).
- Admin "New requirement" form (`admin-requirement-form.tsx`) now takes
  dynamic product rows (title/category/qty each) instead of one — add/remove
  freely, one shared destination/closes/required-by for the whole publish.
- Supplier category matching (`requirementsForSession`) checks **any** item's
  category against the supplier's approved list, not just the top-level
  `catSlug` — a mixed-category requirement is visible to a supplier approved
  for at least one of its products. (Full per-item visibility filtering by
  category — hiding items outside a given supplier's approved categories —
  is not implemented; out of scope for this pass.)

### Itemized quoting and per-item PO issuance

- `quotationVersions.items` — new nullable `jsonb` column,
  `{ title, catSlug, qty, unitPaise }[]`, plus `totalPaise` (`integer`,
  default 0). Present only when the requirement being quoted is
  multi-product; `unitPaise`/`quantity` on the same row become unused (`0`)
  / a display summary (`"N products"`) in that case — single-product
  quoting is untouched.
- Supplier quote/revision forms render a per-product unit-price table
  instead of one price field when `requirement.items.length > 1`; the
  server (`submitQuotation`/`submitRevision`) validates one price per item
  and computes the total.
- `purchaseOrders.reqId` — new nullable column (denormalized from the
  quotation) so every PO line issued from one award can be looked up
  directly, without reaching through `quotationId`.
- Awarding an itemized quotation issues **one PO row per product line**
  (looping the existing single-line `createPo` logic) rather than changing
  the PO table's shape — each line keeps its own fulfilment lifecycle,
  optional catalogue SKU link, and payment tracking, exactly as a
  single-product PO already did.

### Supplier invoice records

- New `invoices` table: header fields (requirement/quotation/supplier
  references, the PO line IDs it covers, `status` draft|sent, the
  **supplier's own** invoice number/date — Smash Pro doesn't assign these),
  plus a `jsonb` `lines` array (description, HSN, qty, UOM, rate, discount,
  taxable value, GST %, CGST/SGST/IGST) and rolled-up totals.
- This is a **record-keeping transcription** of an invoice the supplier
  already issued (the owner's own three reference PDFs are exactly this:
  supplier → Smash Pro purchase invoices), not a tax-calculation engine:
  every HSN/GST-percent value is admin-entered per line (same ADR-0014
  convention as `products.hsn`/`gstPercent`), and the CGST+SGST-vs-IGST
  split is a structural same-state/different-state check (comparing GSTIN
  state-code prefixes) that the admin can always override — never a
  computed or asserted tax position. OBD-11/OBD-20 (GST rate/HSN
  classification validity, invoice compliance) remain open; this ADR does
  not resolve them.
- Admin flow: from a Purchase Orders row, "Generate" opens
  `/admin/invoices/new?reqId=...`, which pulls in every not-yet-invoiced PO
  line for that requirement's award (so a multi-product award produces one
  multi-line invoice, mirroring the reference documents) and lets the admin
  enter the supplier's invoice number/date and per-line HSN/GST%/discount.
  Saved as Draft; "Mark sent" flips it to Sent (terminal, audit-logged).
- `lib/company-profile.ts` holds Smash Pro's own registered buyer-side
  details (legal name, address, GSTIN, PAN, state code) as the invoice's
  fixed Consignee/Buyer block — sourced directly from the owner's own GST
  invoices already on file, not invented.
- Download renders a dedicated print-perfect route
  (`/invoices/[id]/print`, outside the admin shell for a clean printable
  page) with a "Print / Save as PDF" button — no PDF-generation dependency
  added; `print:hidden` was added to the site header/footer/ribbon/WhatsApp
  float (`chrome.tsx`) so the printed output is just the document.

### Supplier requirement detail 404 fix

- `/supplier/requirements/[id]` no longer 404s on a missing `spec`; it
  shows the requirement's real `status`/`statusLabel`/`closes` (previously
  hard-coded "Open"/"Not quoted"/a fixed demo deadline regardless of actual
  state) and a "Products in this requirement" table when `items` is
  present.

## Amendment (2026-11-21) — OBD-22 pickup address confirmed; PDF download

- OBD-22's "pickup location... exact address is `PENDING CONFIRMATION`" is
  now resolved: `lib/company-profile.ts` exports `SMASH_PRO_PICKUP_ADDRESS`
  (built from the same confirmed `SMASH_PRO_PROFILE` this ADR already
  introduced for the invoice buyer block), replacing the placeholder string
  in both `server/buyer.ts` (`PICKUP_ADDRESS_PLACEHOLDER`) and
  `checkout-view.tsx`'s client-side copy of the same constant.
- Fixed a related gap: self-arranged courier orders (`deliveryMethod:
  "self-courier"`) previously got no collection address at all —
  `orders.pickupNote` was only ever set for `"self-pickup"`. A buyer booking
  Porter/Rapido/Uber needs the same warehouse address a self-pickup buyer
  would use, so `createOrderFromCart` now snapshots it for both methods.
  The buyer-facing order detail and admin order detail pages now show
  "Collect from" (the warehouse) and "Deliver to" (the buyer's address)
  separately for self-courier orders, instead of just one "Ship to" row.
- Deliberately **not** extended to supplier addresses: buyers still only
  ever see Smash Pro's address. Suppliers' own `organizations.worksAddress`
  stays internal-only (visible to the supplier itself and admin), matching
  the existing boundary that buyers never learn which supplier fulfilled a
  direct-shipment order (OBD-19's "Smash Pro is the single customer-facing
  contact"). Exposing a supplier's address/identity to buyers directly
  would be a separate, not-yet-made business decision.
- Added a real PDF download for the recorded invoice
  (`@react-pdf/renderer`, pure JS — no headless browser/native deps):
  `GET /api/admin/invoices/[id]/pdf` renders `components/invoice-pdf.tsx`
  (a parallel implementation of `invoice-document.tsx` using react-pdf's own
  primitives) to a `.pdf` file, alongside — not replacing — the print-HTML
  view. The PDF uses "Rs." instead of "₹": the PDF standard-14 Helvetica
  font has no ₹ glyph and silently renders garbage for it; the HTML/print
  view is unaffected and keeps the real ₹ symbol.

## Consequences

- No breaking migration: all new columns/tables are additive and nullable
  with safe defaults (`npm run db:push`, no committed migration file, same
  as ADR-0011/ADR-0014).
- A requirement, quotation version, or PO predating this ADR has
  `items`/`reqId` as `null` and renders exactly as before — every change
  here is additive on top of the existing single-product path.
- GST/HSN/tax-document correctness (OBD-11/OBD-20) is still
  `PENDING CONFIRMATION` and requires professional validation before any of
  this is treated as a compliant e-invoice — the invoice feature is scoped
  deliberately as an internal transcription/record, never represented to a
  buyer, supplier, or tax authority as a system-generated tax document.
