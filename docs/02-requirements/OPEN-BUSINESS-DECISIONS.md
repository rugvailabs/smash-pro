# ProSmash — Open Business Decisions

> Status: Awaiting owner decisions · Last updated: 2026-11-13
>
> Every item here blocks or shapes requirements marked `PENDING CONFIRMATION` in
> the other documents. Each lists the question, why it matters, and the options
> as the team sees them. Decisions should be recorded by updating this file
> (decision + date) and then propagating to the affected documents.

## Decision Register

### OBD-01 — Operating model confirmation ✅ DECIDED (2026-11-13)
**Decision: CONFIRMED — Option B, Hybrid Fulfilment Model.**
1. ProSmash purchases and stocks **selected products** in its own warehouse.
2. **Selected products** may be shipped **directly from suppliers to buyers**.
3. ProSmash manages the buyer relationship and the order process in all cases —
   buyers transact with ProSmash only.
4. Fulfilment method may **vary by product and by supplier**. Not all suppliers
   are eligible for direct shipping; eligibility rules are undecided.

Operational details of direct shipment (eligibility, shipping charges, delivery
responsibility, buyer-information disclosure to suppliers, delivery
confirmation, documentation) remain open — see **OBD-19**.
**Affects:** All documents (propagated 2026-11-13).

### OBD-02 — Business verification requirements (suppliers and buyers)
**Question:** What exactly is required to approve a supplier and a buyer?
GSTIN mandatory for all, or exemptions (e.g. unregistered schools)? Which
documents (GST certificate, PAN, shop & establishment, dealership letters)?
Any third-party GSTIN validation, or manual document review only?
**Affects:** Workflows A, H · SUP-001, BUY-001, PLT-005.

### OBD-03 — Pre-approval and public catalog visibility
**Question:** What do unapproved/anonymous visitors see — full catalog with
prices, catalog without prices, or a login wall? (Roles doc P-03.)
**Why it matters:** Drives the public site design and buyer acquisition funnel.
**Affects:** Workflow H · BUY-002 · homepage/landing design.

### OBD-04 — Supplier supply-catalog pricing
**Question:** Should suppliers record indicative prices on their supply-catalog
items, or is price only ever given via quotations?
**Affects:** Workflow B · SUP-004.

### OBD-05 — Buyer pricing model ✅ DECIDED (2026-11-13)
**Decision: CONFIRMED — Category-Based Discounts with Individual Customer Overrides.**
1. Super Admin controls the **base selling price** of every product.
2. Super Admin can configure **default discount percentages per buyer category**.
3. Super Admin can assign **special discount percentages to individual buyers**
   (overriding their category default).
4. The system **calculates the applicable customer selling price** from base
   price and the buyer's effective discount.
5. Purchase costs, selling prices and **profit margins are visible to Super
   Admin only**.
6. Buyers see **only their own applicable selling prices** — never base-vs-
   discount breakdowns of other buyers, costs, or margins.

Calculation mechanics (actual percentages, GST sequencing, rounding, stacking,
price validity, and how "buyer category" is defined) remain open — see **OBD-20**.
**Affects:** Workflows I, J · ADM-006, BUY-004 · roles doc §3/§4 (propagated 2026-11-13).

### OBD-06 — Requirement routing beyond category match
**Question:** May admin invite specific suppliers outside the category match?
May suppliers browse/quote open requirements outside their declared categories?
**Affects:** Workflow D · ADM-008, SUP-005.

### OBD-07 — Award mechanics and loser communication
**Question:** (a) Are split awards across multiple suppliers allowed for one
requirement? (b) Are non-winning suppliers told "not selected" or merely
"requirement closed"? (c) PO acknowledgement deadline?
**Affects:** Workflow G · ADM-011, SUP-011.

### OBD-08 — Buyer payment policy ✅ DECIDED (2026-11-13)
**Decision: CONFIRMED — 100% Advance Payment.**
1. All business buyers must pay **100% of the order amount before dispatch**.
2. Orders must **not be dispatched until payment is successfully confirmed** —
   this gate applies to warehouse-fulfilled and supplier direct-shipment lines alike.
3. ProSmash will **not offer postpaid or institutional credit facilities**.
4. **Every order carries a payment status** at all times.
5. Super Admin has **full visibility into customer payment transactions**.

Payment operations (gateway selection, accepted methods, refunds, failed
payments, GST sequencing, reconciliation) remain open — see **OBD-21**.
**Affects:** Workflows J, M, N · ADM-015/016, BUY-008 · roles doc §2.3 (propagated 2026-11-13).

### OBD-09 — Minimum order rules
**Question:** Are there MOQs per product, minimum order values per order, or
neither? Set globally or per product/category?
**Affects:** Workflow J · BUY-005.

### OBD-10 — Warehouse footprint
**Question:** Confirm single warehouse at launch (location?), or multiple?
Does serviceable geography limit buyer registration or delivery?
**Affects:** Workflows C, L · ADM-013/014 · delivery promises.

### OBD-11 — Tax and invoicing specifics
**Question:** Confirm GST invoicing requirements: invoice timing (at
confirmation vs dispatch), e-invoicing/e-way bill applicability, HSN capture on
products, inclusive vs exclusive price display.
**Affects:** Workflows J, M, N · BUY-005/008, PLT-005.

### OBD-12 — Supplier discrepancy resolution policy
**Question:** Standard remedies for short/damaged/non-conforming deliveries —
replacement window, debit notes, payment holds? Who signs off?
**Affects:** Workflows L, N · ADM-012.

### OBD-13 — Notification channels
**Question:** In-portal + email is assumed. Add SMS and/or WhatsApp Business for
critical events (requirement published, award, order status)? WhatsApp is a
de-facto business channel in India but adds cost/approval overhead.
**Affects:** Workflow D · PLT-002.

### OBD-14 — Supplier commission / platform fee model
**Question:** Is ProSmash margin purely the spread between procurement cost and
sale price, or is there additionally a supplier-side commission/fee (listing
fee, award fee, settlement deduction)?
**Affects:** Workflows G, N · supplier financial displays (SUP-010, ADM-017).

### OBD-15 — Organizational multi-user accounts
**Question:** Phase 1: single login per buyer/supplier organization, or multiple
users with roles (e.g. buyer requester vs approver; supplier sales vs dispatch)?
(Roles doc P-02.)
**Affects:** Registration flows, BUY-009, SUP-003, PLT-001.

### OBD-16 — Admin internal roles
**Question:** Single Super Admin role at launch, or separated internal roles
(procurement, warehouse, finance, support) with restricted permissions?
(Roles doc P-01.)
**Affects:** ADM-* scoping, audit requirements.

### OBD-17 — Order cancellation and modification windows
**Question:** Until which stage may a buyer self-cancel/modify an order, and
what admin override exists? Any cancellation charges? (Roles doc P-08.)
**Affects:** Workflow J · BUY-006, ADM-015.

### OBD-18 — Rejected-applicant reapplication policy
**Question:** May rejected suppliers/buyers reapply? After any cooling-off
period? Is rejection ever final (blacklist)?
**Affects:** Workflows A, H · SUP-002, BUY-002.

### OBD-19 — Direct-shipment operational rules ◐ PARTIALLY DECIDED (2026-11-13)

**DECIDED — Direct Shipment Eligibility, Option C (2026-11-13):**
1. Super Admin must **approve a supplier** for direct-shipment eligibility.
2. Super Admin must **separately enable direct shipment per individual product**.
3. A product ships direct **only when BOTH** the supplier is approved **and**
   the product is enabled.
4. Suppliers **cannot** independently enable direct-shipment eligibility.
5. Super Admin retains full control over both settings at all times.

**DECIDED — Shipping Charge Management, Option D (2026-11-13):**
1. Super Admin **controls shipping charges** for direct-to-buyer orders.
2. Shipping charges can be **determined individually for each order**.
3. Admin may consider **supplier, product and buyer** when determining the
   applicable charge.
4. Suppliers **cannot** independently determine or change the shipping charge.

**DECIDED — Supplier eligibility visibility (2026-11-13):**
- Suppliers can **view their own** direct-shipment eligibility status.
- Suppliers **cannot modify** their eligibility settings.

**STILL `PENDING CONFIRMATION`:**
(a) Supplier **eligibility evaluation criteria** and the approval procedure
(what qualifies a supplier; review cadence; revocation grounds). (b) **Shipping
charge economics and mechanics** — whether charges are paid by ProSmash, buyer
or supplier in different situations; whether fixed, percentage-based or
manually entered; whether shipping can be free or subsidized; how charges
appear in customer invoices; and handling when one order spans multiple
suppliers. (c) **Delivery responsibility** and liability until buyer receipt.
(d) Exactly what **buyer information** is disclosed to the supplier and under
what confidentiality terms. (e) The **delivery confirmation** process (supplier
claim, buyer acknowledgement, proof-of-delivery upload). (f) **GST documents
and e-way bill** handling (ProSmash invoice to buyer, supplier delivery
challan, e-way bill responsibility).
**Why it matters:** Direct shipment pierces the supplier↔buyer anonymity
boundary (roles doc §3) and changes GST document flows; only the eligibility
mechanism is settled — the operational rules above remain undesignable.
**Affects:** Workflows C, G, J, L, N · ADM-005/012/015/020, SUP-009, BUY-006 · roles doc §3.

### OBD-20 — Pricing calculation mechanics `PENDING CONFIRMATION`
**Question:** For the confirmed pricing model (OBD-05): (a) What are the actual
default discount percentages per buyer category? (b) Is "buyer category" the
registration organization type (school / academy / college / retailer / other),
or a separate admin-managed classification? (c) Are discounts applied **before
or after GST**, and are displayed prices GST-inclusive or exclusive? (d)
**Rounding** rules for calculated prices (decimal places, round to rupee?). (e)
**Stacking** rules — can a category discount and an individual override ever
combine, or does the override fully replace the default? Do promotional
discounts stack? (f) **Price validity** — do base prices and discounts carry
effective/expiry dates, and what happens to in-flight carts/orders when they
change? (g) Who (if anyone beyond Super Admin) approves price or discount changes?
**Why it matters:** These rules define every price a buyer sees and every
margin figure admin sees; order capture (BUY-005) and invoices (OBD-11) depend
on them.
**Affects:** Workflows I, J, M · ADM-006, BUY-004, BUY-005/008.

### OBD-21 — Payment operations details `PENDING CONFIRMATION`
**Question:** For the confirmed 100%-advance policy (OBD-08): (a) **Payment
gateway** selection (also a technology decision for the architecture phase).
(b) Accepted **payment methods** — gateway/UPI/net-banking only, or also bank
transfer (NEFT/RTGS) and cheque recorded manually, and does manual recording
delay the "payment confirmed" gate? (c) **Failed/abandoned payment** handling —
retry windows, how long an unpaid order holds its stock reservation before
auto-cancellation. (d) **Refunds** — triggers (cancellation, short supply,
returns), method, timelines, and who approves. (e) **GST sequencing** on
payment amounts and invoice/receipt timing relative to payment (with OBD-11,
OBD-20). (f) **Reconciliation** rules — matching gateway settlements and bank
credits to orders, handling over/under-payment.
**Why it matters:** The advance-payment gate (no dispatch before confirmed
payment) is only enforceable once "confirmed" is operationally defined.
**Affects:** Workflows J, M · ADM-016, BUY-008 · architecture phase.

## Resolution Log

| ID | Decision | Decided by | Date |
|---|---|---|---|
| OBD-01 | Hybrid Fulfilment Model (Option B): warehouse stocking for selected products + supplier direct shipping for selected products; ProSmash owns the buyer relationship; method varies by product and supplier. Operational details split out to OBD-19. | Owner | 2026-11-13 |
| OBD-05 | Category-Based Discounts with Individual Customer Overrides: admin-controlled base selling price; default discount % per buyer category; per-buyer special discount overrides; system-calculated applicable price; costs/margins admin-only; buyers see only their own prices. Calculation mechanics split out to OBD-20. | Owner | 2026-11-13 |
| OBD-08 | 100% Advance Payment: full payment before dispatch on every order; dispatch gated on confirmed payment; no postpaid/credit facilities; every order carries a payment status; admin has full payment-transaction visibility. Operational details split out to OBD-21. | Owner | 2026-11-13 |
| OBD-19 (partial) | Direct Shipment Eligibility, Option C: admin approves suppliers for direct shipment AND separately enables individual products; both flags required for a direct shipment; suppliers cannot self-enable; admin retains control. Charges, liability, buyer-info disclosure, delivery confirmation, GST/e-way bill handling, and eligibility criteria remain open under OBD-19. | Owner | 2026-11-13 |
| OBD-19 (partial) | Shipping Charge Management, Option D: admin controls direct-to-buyer shipping charges, set individually per order, considering supplier, product and buyer; suppliers cannot determine or change charges. Also confirmed: suppliers can view (not modify) their own eligibility status. Payer allocation, charge method, free/subsidized shipping, invoice presentation and multi-supplier orders remain open under OBD-19. | Owner | 2026-11-13 |
