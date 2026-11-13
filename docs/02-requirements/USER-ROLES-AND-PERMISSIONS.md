# ProSmash — User Roles and Permissions

> Status: Draft for owner review · Last updated: 2026-11-13
> Conventions: ✅ allowed · ❌ denied · 🔶 `PENDING CONFIRMATION`

## 1. Role Overview

| Role | Who | Portal | Account type |
|---|---|---|---|
| Super Admin | ProSmash operations team | Super Admin Portal | Internal staff |
| Supplier | Manufacturer / wholesaler / distributor / dealer | Supplier Portal | Organizational, admin-approved |
| Business Buyer | School / academy / college / retailer / institution | Business Buyer Portal | Organizational, admin-approved |

Phase 1 models **one admin role** (Super Admin). Finer-grained internal roles
(procurement officer, warehouse operator, finance, support) are listed in §5 as a
pending decision. Supplier and Buyer organizations may need multiple user logins
per organization — also §5.

## 2. Role Responsibilities

### 2.1 Super Admin
- Approve, reject, suspend and reactivate supplier and buyer accounts.
- Govern the product catalog: categories, products, publication, pricing shown to buyers.
- Create procurement requirements and route them to suppliers by category.
- Review quotations and revisions, negotiate via internal messaging, compare and
  select winning suppliers.
- Manage purchase orders to suppliers and track supplier fulfilment.
- Manage warehouse inventory: goods receipt, stock levels, adjustments.
- Manage buyer orders: confirmation, fulfilment from warehouse, dispatch, delivery status.
- Oversee buyer payment collection and record/track supplier payments.
- Approve/revoke suppliers for direct-shipment eligibility and enable/disable
  direct shipment per product — both flags are admin-only, and both must be on
  for any direct shipment (OBD-19 Option C).
- Determine the shipping charge for each direct-to-buyer order individually,
  considering supplier, product and buyer (OBD-19 Option D; payer and method
  🔶 OBD-19).
- Act as the single customer-facing contact for delivery complaints (delayed,
  damaged, lost, missing — OBD-19 Option B): receive buyer reports, coordinate
  investigation and resolution with supplier and courier, and manage their
  accountability internally.
- Review direct-shipment delivery confirmations: supplier proof (POD /
  photographs / signed receipts) and buyer receipt confirmation, both recorded
  by the workflow (OBD-19 Option C).
- Handle buyer requests for unlisted products and convert them into procurement
  requirements when warranted.
- Configure platform settings and reference data.

### 2.2 Supplier
- Register and maintain the organization profile and business credentials.
- Declare and update served sport categories (drives requirement notifications).
- Maintain product information (items the supplier can supply, with specifications).
- Receive procurement-requirement notifications; submit quotations and revisions.
- Negotiate with Super Admin through on-platform messaging.
- View award decisions; fulfil awarded purchase orders; update dispatch/fulfilment status.
- Cooperate with ProSmash on direct-shipment delivery investigations; never
  handle buyer delivery complaints directly or redirect buyers to resolve them
  independently (OBD-19 Option B).
- Upload delivery proof (POD, delivery photographs or signed receipts) for
  every direct-to-buyer shipment (OBD-19 Option C).
- Propose purchase-cost changes for supplied items — effective only on Super
  Admin acceptance; never affects customer-facing selling prices (OBD-20).
- View own payment status and history.

### 2.3 Business Buyer
- Register the organization and submit business details for approval.
- Browse and search the published catalog; view pricing (visibility rules: 🔶 §5).
- Place orders; track order and delivery status; view order history and documents.
- Submit requests for products not in the catalog and track their status.
- Report delivery issues (delayed, damaged, lost, missing) to ProSmash only —
  ProSmash is the single point of contact for resolution (OBD-19 Option B).
- Confirm receipt of direct-shipment deliveries through the website when the
  confirmation request arrives via ProSmash (OBD-19 Option C; non-response
  handling 🔶 OBD-19).
- Pay 100% of each order amount in advance — dispatch only after confirmed
  payment; no postpaid or credit facilities (OBD-08; methods 🔶 OBD-21).
- Maintain organization profile, addresses and users (multi-user: 🔶 §5).

## 3. Access Boundaries

Hard boundaries that hold regardless of future permission refinements:

1. **Portal isolation** — each role accesses only its own portal. No shared screens.
2. **Suppliers never see buyers**, with one narrow exception. No buyer
   identities, order volumes, or demand data beyond what an admin chooses to
   include in a procurement requirement. Exception (hybrid model, OBD-01): a
   supplier fulfilling a **direct-shipment PO** receives **only** the Minimum
   Delivery Information (confirmed — OBD-19): recipient name, phone, delivery
   address, product, quantity, delivery instructions and PO reference —
   nothing else about the buyer or order (confidentiality terms for this data:
   🔶 `PENDING CONFIRMATION`, OBD-19).
3. **Buyers never see suppliers.** No supplier identities, quotations, or
   procurement costs. Buyers transact with ProSmash only.
4. **Suppliers never see competing quotations** or other suppliers' identities,
   pricing, or negotiation threads.
5. **Pre-approval lockout** — unapproved suppliers and buyers can complete
   registration and view their application status only; no transactional features.
6. **Pricing separation** (reinforced by OBD-05) — procurement (supplier-side)
   pricing, base selling prices, discount configurations and profit margins are
   visible to Super Admin only. A buyer sees only their own applicable selling
   price; suppliers see neither buyer-facing prices nor margins.
7. **Messaging is scoped** — negotiation messaging exists only between Super Admin
   and one supplier in the context of one requirement/quotation. No
   supplier-to-supplier or buyer-to-supplier channels.
8. **Inventory is internal** — exact warehouse stock is admin-only; buyers see at
   most an availability indication (presentation rule: 🔶 §5).

## 4. Permission Matrix (summary)

| Capability | Super Admin | Supplier | Buyer |
|---|---|---|---|
| Approve/suspend accounts | ✅ | ❌ | ❌ |
| Manage categories & published catalog | ✅ | ❌ | ❌ |
| Set base prices & buyer-category / individual discounts (OBD-05) | ✅ (mechanics 🔶 OBD-20) | ❌ | ❌ |
| View purchase costs, selling prices & margins | ✅ only | ❌ | ❌ (own applicable price only) |
| Propose / approve purchase-cost changes (OBD-20) | ✅ approve | ✅ propose (own items) | ❌ |
| Verify offline payments & process refunds (OBD-21) | ✅ | ❌ | ✅ upload proof, receive refunds (own orders) |
| Manage direct-shipment eligibility (supplier approval + per-product enablement, OBD-19) | ✅ | ❌ (view own status only — confirmed) | ❌ |
| Set direct-to-buyer shipping charges per order (OBD-19 Option D) | ✅ | ❌ | ❌ (visibility on invoice 🔶 OBD-19) |
| Create procurement requirements | ✅ | ❌ | ❌ |
| View procurement requirements | ✅ all | ✅ matched categories only | ❌ |
| Submit/revise quotations | ❌ (receives) | ✅ own only | ❌ |
| View quotations | ✅ all | ✅ own only | ❌ |
| Negotiation messaging | ✅ any supplier thread | ✅ own threads only | ❌ |
| Select winning quotation / issue PO | ✅ | ❌ | ❌ |
| Update supplier fulfilment status | ✅ | ✅ own POs | ❌ |
| Manage warehouse inventory | ✅ | ❌ | ❌ |
| Browse published catalog & pricing | ✅ | ❌ (🔶 §5) | ✅ approved only |
| Place buyer orders | ❌ (🔶 on-behalf-of, §5) | ❌ | ✅ |
| Manage buyer orders & fulfilment | ✅ | ❌ | ✅ view own |
| Record/track buyer payments | ✅ | ❌ | ✅ own |
| Record/track supplier payments | ✅ | ✅ view own | ❌ |
| Submit unlisted-product requests | ❌ (converts them) | ❌ | ✅ |
| Delivery complaints: report / handle (OBD-19 Option B) | ✅ handle & resolve | ❌ (internal cooperation only) | ✅ report own orders |
| Direct-shipment delivery confirmation (OBD-19 Option C) | ✅ review proof & confirmation | ✅ upload proof (own POs) | ✅ confirm receipt (own orders) |
| Platform configuration | ✅ | ❌ | ❌ |

## 5. Permissions Requiring Confirmation — `PENDING CONFIRMATION`

| # | Open permission question |
|---|---|
| P-01 | Internal admin sub-roles: does phase 1 need separated procurement / warehouse / finance / support roles, or is a single Super Admin role acceptable at launch? |
| P-02 | Multi-user organizations: can a buyer or supplier organization have multiple logins with internal roles (e.g. buyer "requester" vs "approver")? |
| P-03 | Pricing visibility: do unapproved/anonymous visitors see the catalog without prices, with prices, or nothing at all? |
| P-04 | Can Super Admin place or edit orders on behalf of a buyer (phone/offline orders)? |
| P-05 | Can suppliers see the public buyer-facing catalog, or is it hidden from them entirely? |
| P-06 | Stock visibility to buyers: exact quantity, banded indicator ("in stock / low"), or none? |
| P-07 | Can suppliers edit a submitted quotation freely before admin review, or only via formal revision after an admin request? |
| P-08 | Buyer self-service cancellation/modification of orders: allowed until which fulfilment stage? |
| P-09 | Who can deactivate a supplier mid-procurement, and what happens to their open quotations? |
| P-10 | Data visibility after suspension: do suspended accounts retain read-only access to their history? |
