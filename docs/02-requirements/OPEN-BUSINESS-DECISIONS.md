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

Direct-shipment operational rules are governed by **OBD-19** (eligibility
mechanism, shipping-charge control, information disclosure and delivery
confirmation now decided there; liability, charge economics and GST
documentation still open).
**Affects:** All documents (propagated 2026-11-13).

### OBD-02 — Business verification requirements ◇ PROPOSED (awaiting owner approval)
**Question:** What exactly is required to approve a supplier and a buyer?
GSTIN mandatory for all, or exemptions (e.g. unregistered schools)? Which
documents? Any third-party GSTIN validation, or manual document review only?

**PROPOSED verification workflows (2026-11-13 — recommendations only, NOT
approved decisions; require owner sign-off and professional validation):**

1. **Buyer registration & verification.** Buyer selects organization type at
   registration. Retailers and companies: GSTIN mandatory, with GST
   certificate upload. Schools/colleges/trusts without GST registration: PAN
   plus institutional registration/affiliation certificate as the alternative
   path (⚠ GST-exemption documentation requires tax-professional validation).
   System performs format validation of GSTIN/PAN; admin performs manual
   document review before approval.
2. **Supplier registration & verification.** GSTIN and PAN mandatory for all
   supplier types; bank account details captured for payables; distributors/
   dealers additionally upload brand authorization or dealership letters;
   manufacturers may add factory/Udyam registration. Same format validation +
   manual admin review.
3. **Admin approval & rejection.** Checklist-based review in the approval
   queue; decisions are Approve / Request changes (field-level remarks the
   applicant sees) / Reject (reason recorded). Rejected applicants may
   correct and reapply; repeated fraudulent submissions can be blacklisted
   (ties to OBD-18).
4. **Document management & verification status.** Each uploaded document
   carries its own status (Submitted → Verified / Rejected / Expired), with
   expiry dates tracked where applicable, re-upload on rejection or expiry,
   and an immutable audit trail of who verified what and when.
5. **Re-verification & suspension.** Re-verification is triggered by
   sensitive-field changes (legal name, GSTIN, bank details) and by a
   periodic review cycle (cadence: owner decision). Failed re-verification or
   confirmed fraud leads to suspension; suspended accounts retain read-only
   access to their own history (aligned with the P-10 proposal).

**Requires professional validation:** GSTIN verification method (manual vs
API), acceptable GST-exemption evidence for institutions, and any KYC/AML
obligations applying to supplier payouts.
**Affects:** Workflows A, H · SUP-001/002, BUY-001/002, PLT-005.

### OBD-03 — Public catalog visibility ✅ DECIDED (2026-11-13)
**Decision: CONFIRMED — Public product catalogue with login-based discounts.**
1. Anonymous visitors can **browse the complete public product catalogue**.
2. Visitors see product names, images, descriptions, specifications and the
   **standard listed selling price** — the OBD-05 admin-controlled base
   selling price, displayed GST-inclusive per OBD-20.
3. Public visitors **never see** buyer-category discounts, individual customer
   discounts or discounted prices.
4. **Buyers must log in** to see their applicable discounts and discounted
   prices.
5. OBD-05 pricing rules apply unchanged (base price; category default
   discounts; individual override).
6. OBD-20 GST-inclusive display and tax-calculation decisions apply unchanged
   to both the public standard price and logged-in discounted prices.
7. Public pages expose **no supplier purchase costs, margins or confidential
   commercial information** (access boundaries unchanged).
8. Existing buyer eligibility and verification requirements are preserved;
   ordering and transactions still require an **approved** buyer account.

**Clarification DECIDED (2026-11-13):** discount visibility is
**approval-gated** — anonymous visitors and registered-but-not-yet-approved
buyers both see standard listed prices only; **approved and logged-in buyers**
see their applicable discounted prices. Ordering remains approval-gated.
OBD-05 and OBD-20 pricing rules apply unmodified.

Resolves roles-doc **P-03**; by making the catalog public it also effectively
resolves **P-05** (suppliers, like anyone, can view the public catalog with
standard prices only — discounts and margins remain invisible to them).
**Affects:** Workflows H, I · BUY-002/003/004, PLT-006 · UI plan (public
screens, dependency D1) · homepage design (propagated 2026-11-13).

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

Calculation mechanics are governed by **OBD-20** (GST sequencing, display,
precedence, precision, validity and authority now decided there; actual
percentages, GST rates/HSN and the "buyer category" definition still
open/proposed).
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

Payment operations are governed by **OBD-21** (methods, verification paths,
retries/timeout, reservation release and refund policy now decided there;
gateway selection, timeout defaults, reconciliation and invoice timing still
open/proposed).
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

**Scoped addition, still OPEN (owner, 2026-11-20, ADR-0014):** `products.hsn`
and new `products.gstPercent` are now admin-settable as plain,
manually-entered record-keeping fields (format/range-checked only — 4–8
digit HSN, 0–100 GST%). This is data capture only: nothing is auto-assigned,
and neither field is read by any pricing, checkout, or invoice calculation.
HSN capture itself remains the only part of this OBD touched; invoice
timing, e-invoicing/e-way bill applicability, and inclusive-vs-exclusive
display stay fully open, and the captured values are not yet validated
against any tax classification authority.

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

**DECIDED — Delivery Issue Management, Option B (2026-11-13):**
1. ProSmash is the **single customer-facing contact** for direct-shipment
   delivery complaints.
2. Buyers report **delayed, damaged, lost or missing** shipments to ProSmash.
3. ProSmash **coordinates investigation and resolution** with the relevant
   supplier and courier.
4. Supplier and courier **accountability is managed internally** by ProSmash.
5. Suppliers must **not redirect buyers** to resolve delivery complaints
   independently.

**DECIDED — Delivery Confirmation, Option C: Supplier Proof + Buyer Confirmation (2026-11-13):**
1. Supplier must **upload delivery proof** for direct-to-buyer shipments.
2. Accepted proof types may include **Proof of Delivery (POD), delivery
   photographs or signed receipts**.
3. Buyer must receive a **delivery confirmation request through ProSmash**.
4. Buyer must be able to **confirm receipt through the website**.
5. Super Admin must be able to **review supplier proof and buyer confirmation**.
6. The delivery confirmation workflow **records both** supplier proof
   submission and buyer confirmation.

**DECIDED — Proof-First Sequence, Option A (2026-11-13):**
- The buyer's delivery confirmation request is triggered **only after** the
  supplier uploads delivery proof. No confirmation request is sent to the
  buyer while proof is outstanding.

**DECIDED — Minimum Delivery Information Disclosure (2026-11-13):**
For a direct-shipment PO, the supplier receives **only**: recipient name,
phone number, delivery address, product, quantity, delivery instructions, and
the PO reference. No other buyer information (organization financials, buyer
pricing, email, order context, or other order lines) is ever disclosed.

**STILL OPEN — with PROPOSED approaches (recommendations only, NOT approved):**

(a) **Eligibility evaluation criteria.** ◇ PROPOSED: at launch, admin judgment
based on supplier type, document completeness and packaging/dispatch
capability; once history exists, score on on-time-in-full rate, dispute rate
and document compliance, reviewed quarterly; revocation on repeated failures
or fraud.
(b) **Shipping charge economics.** ◇ PROPOSED: buyer pays, shown as a separate
line at checkout and on the invoice; admin enters the charge manually per
order at launch (no formula); admin may set ₹0 (free/subsidized) at
discretion; multi-supplier orders carry one charge per consignment, summed on
the order.
(c) **Legal liability and financial recovery.** ◇ PROPOSED: for direct
shipments the supplier bears delivery risk until buyer confirmation; recovery
via debit note against supplier payables; buyer remedy order is replacement
first, refund second. ⚠ Requires **legal validation** before adoption.
(d) **Delivery confirmation edge cases.** ◇ PROPOSED: if the buyer does not
respond, auto-confirm after a configurable window (suggestion: 7 days) with
reminder notifications before expiry; a complaint (ADM-022/BUY-010) freezes
auto-confirmation; partial deliveries are recorded quantity-wise against the
PO; admin may manually resolve any confirmation with a recorded reason.
(e) **POD validation and evidence retention.** ◇ PROPOSED: manual admin visual
check at launch; evidence retained for the statutory records period
(⚠ confirm duration with accountant — Indian tax record-keeping norms).
(f) **GST documents and e-way bill handling.** `PENDING CONFIRMATION` — the
bill-to/ship-to document model (supplier invoices ProSmash; ProSmash invoices
buyer; goods move supplier→buyer) and e-way bill responsibility **must be
designed with a tax professional**; no proposal is made here.

**Why it matters:** Direct shipment pierces the supplier↔buyer anonymity
boundary (roles doc §3) and changes GST document flows.
**Affects:** Workflows C, G, J, L, N · ADM-005/012/015/020-023, SUP-009, BUY-006/010/011 · roles doc §3.

### OBD-20 — Pricing calculation mechanics ◐ PARTIALLY DECIDED (2026-11-13)

**DECIDED — Discount Calculation, Option A: Before GST (2026-11-13):**
1. The applicable buyer discount is applied to the product price **before GST**.
2. GST is calculated **on the discounted taxable value**.
3. GST is then added to determine the **final customer payable amount**.

> Note: this records business direction only — it is **not a substitute for
> validation by an accountant or tax professional** before implementation.

**DECIDED — Individual Discount Precedence, Option A: Individual Override (2026-11-13):**
1. Every buyer can receive a **default discount based on their buyer category**.
2. Super Admin can assign a **special discount to an individual buyer**.
3. An assigned individual discount **completely replaces** the buyer-category
   discount.
4. The system must **never add** the category discount and individual discount
   together.
5. If no individual discount exists, the **category discount applies**.
6. Exactly **one applicable discount** is used in each buyer-and-product
   pricing calculation.

_Example: category discount 20%, individual discount 30% → final applicable
discount is 30%, not 50%._

**DECIDED — Customer Price Display, Option A: GST-Inclusive Pricing (2026-11-13):**
1. Product prices displayed to buyers **include applicable GST**.
2. Buyers see **GST details separately at checkout**.
3. Customer invoices show the **applicable GST breakdown**.
4. The buyer's applicable discount is applied **before GST** (consistent with
   Discount Calculation Option A above).
5. GST is calculated **on the discounted taxable value**.
6. The **final customer payable amount includes GST**.

**DECIDED — Promotional Discounts (2026-11-13):**
1. Promotional discounts are **supported**.
2. A promotional discount **cannot be combined** with any other discount —
   the single-applicable-discount rule holds.
3. An **individual customer discount takes priority** over a promotional
   discount.
   (Precedence between a promotional discount and the buyer-category default
   when no individual discount exists: ◇ PROPOSED — apply whichever is more
   favourable to the buyer, never both; awaiting owner confirmation.)

**DECIDED — Monetary Precision (2026-11-13):**
- All monetary values use **two-decimal precision**.
  (Rounding method — e.g. half-up, applied per line vs on totals: ◇ PROPOSED —
  round half-up at line level, sum lines for totals; ⚠ validate with
  accountant for GST-invoice arithmetic.)

**DECIDED — Price Validity & Change Management (2026-11-13):**
1. Price changes can be **immediate or scheduled** (effective date/time).
2. **Existing confirmed orders retain their original prices** — price and
   discount changes never reprice captured orders.

**DECIDED — Price Change Authority (2026-11-13):**
1. **Suppliers may propose purchase-cost changes**; proposals have no effect
   until accepted by Super Admin.
2. **Only Super Admin approves customer-facing selling-price changes** (base
   prices and all discount configurations).

**STILL OPEN — with PROPOSED approaches where sensible:**

(a) Actual default **discount percentages** per buyer category —
`PENDING CONFIRMATION`; a pure commercial decision for the owner (the system
only needs them to be admin-configurable).
(b) **"Buyer category" definition** — ◇ PROPOSED: equal to the registration
organization type (school / academy / college / retailer / other) at launch,
avoiding a second classification to administer; awaiting owner confirmation.
(c) **Product-wise GST rates and HSN classification** —
`PENDING CONFIRMATION`; never to be invented by the team; ⚠ requires
tax-professional input (with OBD-11).
(d) **Rounding method detail** — ◇ PROPOSED under Monetary Precision above;
⚠ accountant validation.
(e) **Promotional-vs-category precedence** (no individual discount present) —
◇ PROPOSED under Promotional Discounts above.
(f) **CGST/SGST versus IGST determination** (place-of-supply logic) —
`PENDING CONFIRMATION`; ⚠ tax professional.
(g) **Invoice and credit-note compliance details** — `PENDING CONFIRMATION`
(with OBD-11); ⚠ tax professional.
(h) **Tax-professional validation** of the entire pricing/GST treatment before
implementation — standing requirement.
**Why it matters:** These rules define every price a buyer sees and every
margin figure admin sees; order capture (BUY-005) and invoices (OBD-11) depend
on them.
**Affects:** Workflows I, J, M · ADM-006, BUY-004, BUY-005/008.

### OBD-21 — Payment operations ◐ PARTIALLY DECIDED (2026-11-13)

**DECIDED — Payment Methods & Operations (2026-11-13):**
1. Supported methods: **UPI, credit/debit cards, Net Banking, NEFT/RTGS and
   cheques**.
2. Online payments (UPI/cards/Net Banking) are **automatically verified
   through the payment gateway**.
3. **NEFT/RTGS and cheque payments require buyer proof upload and Super Admin
   verification** before the payment counts as confirmed.
4. **Failed payments allow retries** before a **configurable timeout** cancels
   the order.
5. **Available warehouse stock is reserved when the order is placed.**
6. The reservation is **released after payment timeout and cancellation**.
7. **Refund rules are configurable by Super Admin.**
8. The **original payment method is the default refund destination**; bank
   transfer can be used as an **admin-approved exception**.

**STILL OPEN — with PROPOSED approaches:**
(a) **Payment gateway selection** — `PENDING CONFIRMATION`; a technology
decision for the architecture phase (shortlist Indian gateways supporting UPI
+ cards + net banking and B2B flows).
(b) **Timeout values** — configurable by decision; ◇ PROPOSED defaults:
72 hours for online-payment orders, 5 business days where the buyer has
declared an NEFT/RTGS/cheque payment in progress; awaiting owner confirmation.
(c) **Reconciliation** — ◇ PROPOSED: daily automatic matching of gateway
settlements to orders; manual admin matching for bank credits/cheques;
over/under-payments flagged for admin action, with excess refunded via the
refund rules. ⚠ Accountant validation for the reconciliation ledger treatment.
(d) **Invoice/receipt timing relative to payment** — `PENDING CONFIRMATION`
(with OBD-11/OBD-20); ⚠ tax professional.
**Affects:** Workflows J, L, M · ADM-015/016/024, BUY-008 · architecture phase.

### OBD-22 — Buyer delivery method & free-delivery threshold ✅ DECIDED (2026-11-20)

**Decision: CONFIRMED — three delivery methods for warehouse-fulfilled buyer
orders, additive to the OBD-01 Hybrid Fulfilment Model (supplier
direct-shipment keeps its own OBD-19 shipping-charge rules unchanged).**

1. At checkout, the buyer chooses one of:
   a. **Self-pickup** — collect from the ProSmash warehouse. No charge.
   b. **Self-arranged courier** — buyer books their own courier/aggregator
      (e.g. Porter, Rapido, Uber Parcel) and pays that courier directly;
      ProSmash has the order ready for collection. No charge to ProSmash.
   c. **Smash Pro managed delivery** — available **only** when the order's
      GST-inclusive items total (before any shipping line) is **≥ ₹50,000**.
      When available, it is **free**.
2. Below the ₹50,000 threshold, managed delivery is **not offered** — the
   buyer must choose self-pickup or a self-arranged courier. There is no
   paid managed-delivery tier.
3. **No Cash on Delivery.** COD is not and has never been a supported
   payment method (OBD-21 lists UPI, cards, Net Banking, NEFT/RTGS, cheque
   only) — this decision explicitly confirms COD stays excluded.
4. The pickup location is a **single warehouse address** — confirmed to
   exist, but the exact address is `PENDING CONFIRMATION` (owner to supply;
   shown as a placeholder in the UI/data until then).
5. This replaces the previous flat illustrative shipping-fee placeholder
   (`DEMO_SHIPPING_PAISE`) used on warehouse-fulfilled orders — under this
   decision there is **never** a shipping charge collected from the buyer
   for warehouse-fulfilled lines; delivery is either self-arranged (buyer's
   own cost, outside the platform) or free.

**Still open:** exact pickup address (owner to confirm); whether multiple
pickup/warehouse locations will ever exist (ties to OBD-10, still open);
any operational handoff process for self-arranged-courier pickups (e.g.
ID verification at the gate) is not specified here.
**Affects:** Workflow J · BUY-005/006, ADM-015 · `orders.deliveryMethod`
(new column, ADR-0009) · checkout UI, order detail, cart summary.

### OBD-23 — Product cost-price entry & visitor discount display ✅ DECIDED (2026-11-20)

**Decision: CONFIRMED — the Add Product form resolves the visitor selling
price from cost inputs instead of taking it as a single direct entry.**

1. Admin enters an **MRP (cut-off price)** per product — the reference price
   shown struck through against the visitor selling price.
2. Admin enters **Dealer/Purchase Price** and **ProSmash Margin** as two
   independent fields, each switchable between **% of their own base** or a
   **fixed ₹ amount**. Resolution is server-side, never trusted from a
   client total:
   - `purchase_paise` = purchase% × **MRP**, or the fixed ₹ entry.
   - `margin_paise` = margin% × **Dealer/Purchase Price** (amended
     2026-11-20, see below), or the fixed ₹ entry.
   - **Visitor Selling Price** (`stdPaise` — unchanged column, same field
     every other buyer-pricing/display path already reads) = Purchase +
     Margin.
   - **Visitor Discount %** = `(MRP − Visitor Selling Price) / MRP`, floored
     at 0% (a resolved price at or above MRP shows no discount, not a
     negative one).
3. Purchase price and margin are **admin-only** — never serialised to any
   public, visitor, or buyer-facing API response (same access boundary as
   the existing OBD-05 cost/margin rule). **MRP is the one exception,
   amended 2026-11-20**: it is a public marketing figure, not a cost/margin
   figure, so it IS now serialised publicly — every visitor and pending
   account sees "MRP ₹X, now ₹Y, Z% off" the same way the standard listed
   price already works (`server/pricing.ts` `PricedProduct.mrp`,
   `components/product.tsx` `PriceBlock`/`ProductCard`/`ProductListRow`).
   An approved buyer still sees their own OBD-05 category discount as the
   one highlighted saving (point 4) — MRP is not additionally surfaced on
   top of it there, to keep one primary number in front of a signed-in buyer.
4. **Approved-buyer pricing is unaffected and stays separate**: it remains
   the OBD-05 per-buyer-category discount applied off the resolved visitor
   selling price, set on the Pricing page — this decision only changes how
   admin *arrives at* the visitor selling price on creation, not how buyer
   pricing is derived from it afterwards.
5. This governs the **Add Product form only**. Existing bulk-catalogue
   price edits and `updateProduct` continue to set the visitor selling price
   directly; retrofitting them to this cost-entry model is not in scope here.

**Flagged assumption — RESOLVED (owner, 2026-11-20):** the originally
flagged reading (margin % of MRP) was corrected. **ProSmash Margin is a
markup on Dealer/Purchase Price, not on MRP** — Purchase Price's own %
mode stays % of MRP; only Margin's base changed. Worked example (owner-
supplied): MRP ₹1,000, Dealer Price ₹600, Margin 10% of Dealer Price = ₹60
→ Visitor Selling Price ₹660 → Visitor Discount 34% off MRP. See
ADR-0011 Amendment for the implementation detail.
**Affects:** ADM-catalog (Add Product) · `products.mrpPaise`,
`purchaseMode/Value/Paise`, `marginMode/Value/Paise` (new columns) ·
no change to buyer pricing (`server/pricing.ts`, `/admin/pricing`).

## Resolution Log

| ID | Decision | Decided by | Date |
|---|---|---|---|
| OBD-01 | Hybrid Fulfilment Model (Option B): warehouse stocking for selected products + supplier direct shipping for selected products; ProSmash owns the buyer relationship; method varies by product and supplier. Operational details split out to OBD-19. | Owner | 2026-11-13 |
| OBD-05 | Category-Based Discounts with Individual Customer Overrides: admin-controlled base selling price; default discount % per buyer category; per-buyer special discount overrides; system-calculated applicable price; costs/margins admin-only; buyers see only their own prices. Calculation mechanics split out to OBD-20. | Owner | 2026-11-13 |
| OBD-08 | 100% Advance Payment: full payment before dispatch on every order; dispatch gated on confirmed payment; no postpaid/credit facilities; every order carries a payment status; admin has full payment-transaction visibility. Operational details split out to OBD-21. | Owner | 2026-11-13 |
| OBD-19 (partial) | Direct Shipment Eligibility, Option C: admin approves suppliers for direct shipment AND separately enables individual products; both flags required for a direct shipment; suppliers cannot self-enable; admin retains control. Charges, liability, buyer-info disclosure, delivery confirmation, GST/e-way bill handling, and eligibility criteria remain open under OBD-19. | Owner | 2026-11-13 |
| OBD-19 (partial) | Shipping Charge Management, Option D: admin controls direct-to-buyer shipping charges, set individually per order, considering supplier, product and buyer; suppliers cannot determine or change charges. Also confirmed: suppliers can view (not modify) their own eligibility status. Payer allocation, charge method, free/subsidized shipping, invoice presentation and multi-supplier orders remain open under OBD-19. | Owner | 2026-11-13 |
| OBD-19 (partial) | Delivery Issue Management, Option B: ProSmash is the single customer-facing contact for direct-shipment delivery complaints (delayed/damaged/lost/missing); ProSmash coordinates investigation and resolution with supplier and courier; supplier/courier accountability managed internally; suppliers must not redirect buyers. Legal liability, financial recovery, compensation, replacement and refund policies remain open under OBD-19. | Owner | 2026-11-13 |
| OBD-19 (partial) | Delivery Confirmation, Option C (Supplier Proof + Buyer Confirmation): supplier uploads delivery proof (POD / photographs / signed receipt) for direct-to-buyer shipments; buyer receives a confirmation request through ProSmash and confirms receipt on the website; admin reviews both; the workflow records proof submission and buyer confirmation. Buyer non-response, disputes/partial deliveries, deadlines, admin manual resolution, and POD validation/retention remain open under OBD-19. | Owner | 2026-11-13 |
| OBD-19 (partial) | Proof-First Sequence, Option A: the buyer's delivery confirmation request is triggered only after the supplier uploads delivery proof; no request is sent while proof is outstanding. | Owner | 2026-11-13 |
| OBD-20 (partial) | Discount Calculation, Option A (Before GST): buyer discount applies to the product price before GST; GST is calculated on the discounted taxable value; GST is added to reach the final payable amount. Percentages, GST rates/classification, inclusive-vs-exclusive display, stacking/override precedence, rounding, price validity and approval authority remain open under OBD-20. Subject to tax-professional validation. | Owner | 2026-11-13 |
| OBD-20 (partial) | Individual Discount Precedence, Option A (Individual Override): an assigned individual discount completely replaces the buyer-category discount; the two are never added; with no individual discount the category discount applies; exactly one discount per buyer-and-product calculation (e.g. 20% category + 30% individual → 30%, not 50%). Percentages, promotional discounts, rounding, validity and approval authority remain open under OBD-20. | Owner | 2026-11-13 |
| OBD-20 (partial) | Customer Price Display, Option A (GST-Inclusive Pricing): displayed buyer prices include applicable GST; GST shown separately at checkout; invoices carry the GST breakdown; discount applied before GST on the discounted taxable value; final payable includes GST. GST rates/HSN, storage/display precision, rounding, CGST/SGST-vs-IGST, invoice/credit-note compliance, and tax-professional validation remain open under OBD-20. | Owner | 2026-11-13 |
| OBD-19 (partial) | Minimum Delivery Information Disclosure: direct-shipment suppliers receive only recipient name, phone, delivery address, product, quantity, delivery instructions and PO reference — nothing else about the buyer or order. | Owner | 2026-11-13 |
| OBD-20 (partial) | Promotional discounts supported, never combinable with other discounts, individual discount takes priority over promotional; two-decimal monetary precision; price changes immediate or scheduled; existing confirmed orders retain original prices; suppliers may propose purchase-cost changes; only Super Admin approves customer-facing selling-price changes. Percentages, GST rates/HSN, CGST/SGST-vs-IGST, invoice compliance, rounding method and promo-vs-category precedence remain open/proposed. | Owner | 2026-11-13 |
| OBD-21 (partial) | Payment Methods & Operations: UPI, cards, Net Banking, NEFT/RTGS, cheques; online payments auto-verified via gateway; NEFT/RTGS/cheque need buyer proof + admin verification; failed payments retry until configurable timeout cancels the order; available stock reserved at order placement and released on timeout cancellation; refund rules admin-configurable; original payment method is the default refund destination, bank transfer as approved exception. Gateway choice, timeout defaults, reconciliation and invoice timing remain open/proposed. | Owner | 2026-11-13 |
| OBD-03 | Public product catalogue with login-based discounts: anonymous visitors browse the full catalog with names, images, descriptions, specs and the standard listed selling price (OBD-05 base price, GST-inclusive per OBD-20); discounts and discounted prices require login; no supplier costs, margins or confidential commercial data on public pages; OBD-05/OBD-20 rules unchanged; existing approval/verification gates preserved (transactions still require approval). Clarified same day: discount visibility is approval-gated — pending accounts see standard prices; approved logged-in buyers see discounted prices. | Owner | 2026-11-13 |
| PLT-001 amendment | Authentication and role-scoped access (unified website): one unified application for public catalogue, buyer and supplier workflows; Super Admin remains a separate application; shared screens limited to the public catalogue (PLT-006); one credential grants exactly one role (OBD-15 remains open); server-side role scoping of routes and data; access boundaries §3 items 2–8 unchanged. Applied to FUNCTIONAL-REQUIREMENTS.md, USER-ROLES-AND-PERMISSIONS.md §3.1 and UI-PREPARATION-PLAN.md §1. | Owner | 2026-11-16 |
| OBD-22 | Buyer delivery method & free-delivery threshold: three options for warehouse-fulfilled orders — self-pickup (free), self-arranged courier e.g. Porter/Rapido/Uber (buyer pays the courier directly, free to ProSmash), or Smash-Pro-managed delivery (free, but only offered when the GST-inclusive items total is ≥ ₹50,000 — no paid managed tier below that). Confirms COD was never and is not a supported payment method. Removes the prior flat illustrative shipping-fee placeholder on warehouse-fulfilled orders. Pickup address confirmed to exist but exact address is PENDING CONFIRMATION. | Owner | 2026-11-20 |
| OBD-23 | Product cost-price entry & visitor discount display: Add Product form takes MRP (cut-off price) plus Dealer/Purchase Price and ProSmash Margin, each entered as % of MRP or a fixed ₹ amount; server resolves Purchase + Margin into the visitor selling price (unchanged `stdPaise` field/column) and a floored Visitor Discount % off MRP; purchase/margin remain admin-only, never serialised publicly; approved-buyer category pricing is untouched and stays a separate discount off the resolved selling price; governs the Add Product form only, not bulk-catalogue price edits. Owner should confirm the flagged assumption that % mode is of MRP, not a purchase-price markup. | Owner | 2026-11-20 |
| OBD-23 (amendment) | MRP and the resulting Visitor Discount % are made PUBLIC (unlike purchase/margin, which stay admin-only): every visitor and pending account now sees "MRP ₹X, now ₹Y, Z% off" on product cards and the product page, the same way the standard listed price already displays. Approved buyers continue to see only their own OBD-05 category discount as the highlighted saving — MRP is not additionally shown stacked on top of it for a signed-in buyer. | Owner | 2026-11-20 |
| OBD-23 (amendment) | Margin-base correction: ProSmash Margin resolves as a percentage of **Dealer/Purchase Price**, not MRP (Purchase Price's own % mode is unaffected, still % of MRP). `margin_amount = dealer_price × margin% / 100`; `visitor_selling_price = dealer_price + margin_amount`; `visitor_discount% = (MRP − visitor_selling_price) / MRP` unchanged, still vs MRP. Fixed-₹ margin mode was already base-agnostic and needed no change. | Owner | 2026-11-20 |
