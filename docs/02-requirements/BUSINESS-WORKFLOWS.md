# ProSmash — Business Workflows

> Status: Draft for owner review · Last updated: 2026-11-13
>
> Operating model (OBD-01, **CONFIRMED** — Hybrid Fulfilment Model): Admin
> procures from suppliers → buyers order from the ProSmash catalog → ProSmash
> manages the order and collects payment → supplier payments are settled by
> ProSmash. Fulfilment varies **by product and supplier**: selected products are
> stocked in and shipped from the ProSmash warehouse; selected products from
> **eligible** suppliers ship directly from supplier to buyer. Eligibility is
> dual-gated (confirmed — OBD-19 Option C): Super Admin approves the supplier
> for direct shipment AND separately enables each product; both are required,
> and suppliers cannot self-enable (suppliers can view, not modify, their own
> eligibility status). Shipping charges for direct-to-buyer orders are
> admin-controlled and set per order considering supplier, product and buyer
> (confirmed — OBD-19 Option D); suppliers never set charges. Evaluation
> criteria, who bears shipping costs, charge method, invoice presentation,
> delivery responsibility and buyer-information disclosure remain
> `PENDING CONFIRMATION` (OBD-19). In every case buyers transact with ProSmash only.
>
> Each workflow lists: actors, trigger, steps, outcome, and open points.

---

## A. Supplier Registration and Admin Approval

**Actors:** Supplier (applicant), Super Admin · **Trigger:** supplier visits the registration page.

1. Supplier opens the Supplier Portal registration form.
2. Supplier submits: organization name, supplier type (manufacturer / wholesaler /
   distributor / dealer), contact person and details, business address, served
   sport categories, business credentials (GST number and documents — exact
   verification requirements `PENDING CONFIRMATION`), and optional brand/product summary.
3. System creates the account in **Pending Approval** state; supplier can log in
   but sees only application status and profile completion.
4. Super Admin is notified; reviews the application and documents in an approval queue.
5. Super Admin either:
   - **Approves** → account becomes Active; supplier is notified and gains full portal access; or
   - **Requests changes** → supplier is notified of what to fix and resubmits (loop to step 4); or
   - **Rejects** → account becomes Rejected with a recorded reason; supplier is notified.
     (Whether rejected suppliers may reapply, and after what interval: `PENDING CONFIRMATION`.)
6. All state changes are timestamped and auditable.

**Outcome:** a verified, categorized, Active supplier able to receive requirements.

---

## B. Supplier Profile and Product Information Management

**Actors:** Supplier; Super Admin (oversight) · **Trigger:** supplier updates profile or products any time after approval.

1. Supplier maintains the organization profile: contacts, addresses, served
   categories, credentials and documents.
2. Supplier maintains a **supply catalog**: items they can supply, each with name,
   category, brand, specifications, images, and indicative supply capability
   (capacity, lead time; indicative price `PENDING CONFIRMATION` whether collected).
3. The supply catalog is **sourcing information for Super Admin** — it is not
   automatically published to buyers (buyer-facing catalog is admin-curated; OBD-03).
4. Edits to sensitive fields (legal name, GST details, bank details, served
   categories) enter **admin re-review** before taking effect; routine edits
   (contact phone, product specs) apply immediately. Exact sensitive-field list:
   `PENDING CONFIRMATION`.
5. Category changes update which procurement requirements the supplier is notified about.
6. Suppliers may **propose purchase-cost changes** for items they supply;
   proposals take effect only on **Super Admin acceptance** and never alter
   customer-facing selling prices, which only admin controls (confirmed —
   OBD-20 Price Change Authority).

**Outcome:** an up-to-date supplier profile and supply catalog usable for sourcing decisions.

---

## C. Admin-Managed Procurement Requirement Creation

**Actors:** Super Admin · **Trigger:** stock planning, a buyer order needing stock, or a buyer unlisted-product request (Workflow K).

1. Super Admin creates a **Procurement Requirement** with: title, sport category
   (drives routing), product specifications (structured fields + free text +
   attachments), required quantity, required-by date, delivery destination —
   ProSmash warehouse, or direct-to-buyer delivery for direct-shipment
   procurement (full delivery details are disclosed only at PO stage, limited
   to the Minimum Delivery Information set — OBD-19) — and quotation deadline.
2. Requirement may reference its origin (stock plan, buyer order, buyer request)
   for internal traceability — origin details are never exposed to suppliers.
3. Requirement is saved as **Draft**; admin can edit freely.
4. Admin **publishes** the requirement → state Open; Workflow D (notifications) fires.
5. Admin may amend an Open requirement (quantity, deadline); suppliers with
   submitted quotations are notified of amendments.
6. Admin may **close** (deadline reached or manually) or **cancel** (with reason)
   the requirement. Closed requirements proceed to comparison (Workflow G).

**Outcome:** a published, category-routed requirement collecting quotations.

---

## D. Category-Based Supplier Notifications

**Actors:** System, Suppliers · **Trigger:** a procurement requirement is published or amended.

1. System matches the requirement's category against Active suppliers' served categories.
2. Matched suppliers receive an **in-portal notification** and an email
   (additional channels such as SMS/WhatsApp: `PENDING CONFIRMATION`).
3. Notification shows requirement summary and deadline; links into the Supplier
   Portal requirement detail.
4. Suppliers can view all open requirements matching their categories in a
   dedicated list, independent of notifications.
5. Admin can additionally hand-pick suppliers to invite (including outside the
   category match: `PENDING CONFIRMATION` whether allowed) and see who viewed the requirement.
6. Non-matching suppliers never see the requirement.

**Outcome:** every relevant approved supplier is aware of the open requirement.

---

## E. Supplier Quotation Submission and Multiple Revisions

**Actors:** Supplier, Super Admin · **Trigger:** supplier opens an open requirement.

1. Supplier reviews requirement details and submits a **Quotation**: unit price,
   total, quoted quantity (full or partial — partial-quote policy
   `PENDING CONFIRMATION`), delivery lead time, validity period, payment terms
   requested, and notes/attachments (specs, certificates, samples offered).
2. Quotation enters state **Submitted**, visible to Super Admin only.
3. **Revisions:** a supplier may submit revised versions of their quotation —
   on their own initiative while the requirement is open, or in response to a
   revision request from admin during negotiation (Workflow F).
4. Every revision is stored as a **new version**; full version history (what
   changed, when) is retained and visible to both the supplier (own only) and admin.
5. Supplier may **withdraw** a quotation before award; withdrawal is recorded.
6. After the requirement closes, revisions are allowed **only** on admin request
   (`PENDING CONFIRMATION`).

**Outcome:** versioned quotations from competing suppliers, ready for comparison.

---

## F. Admin–Supplier Negotiation through Internal Messaging

**Actors:** Super Admin, one Supplier per thread · **Trigger:** admin opens a negotiation on a quotation.

1. Each negotiation is a **private thread** scoped to one requirement + one
   supplier's quotation. Suppliers never see other threads or other suppliers' existence.
2. Both parties exchange messages and attachments; admin can formally **request a
   revision** from the thread (feeds Workflow E step 3).
3. Thread shows quotation version context — which version was current at each message.
4. All messages are timestamped, immutable and auditable; no off-platform contact
   details should be required to complete a negotiation.
5. Admin can run multiple threads in parallel across suppliers for one requirement.
6. Threads close automatically when the requirement is awarded/cancelled;
   closed threads remain readable to both parties.

**Outcome:** a complete, auditable negotiation record per supplier.

---

## G. Quotation Comparison and Supplier Selection

**Actors:** Super Admin · **Trigger:** quotation deadline reached, or admin decides enough quotations are in.

1. Admin opens a **comparison view** for the requirement: all quotations
   (latest versions) side by side — price, quantity, lead time, validity, terms,
   supplier profile signals (type, history, past fulfilment performance).
2. Admin may shortlist, continue negotiating (Workflow F), or request final revisions.
3. Admin **selects the winning quotation(s)** — split awards across multiple
   suppliers allowed (`PENDING CONFIRMATION`).
4. Selection generates a **Purchase Order (PO)** to each winning supplier
   capturing the agreed version's terms, including the **fulfilment destination**
   (ProSmash warehouse, or direct-to-buyer — allowed only when the supplier is
   admin-approved for direct shipment AND the product is direct-shipment
   enabled, OBD-19 Option C; evaluation criteria `PENDING CONFIRMATION`);
   winning suppliers are notified and must **acknowledge** the PO
   (acknowledgement deadline: `PENDING CONFIRMATION`).
5. Non-winning suppliers are notified that the requirement is closed
   (whether they are told they lost vs. simply "closed": `PENDING CONFIRMATION`).
6. The decision (chosen quotation version, rationale note) is recorded for audit.

**Outcome:** awarded PO(s) driving supplier fulfilment (Workflow N).

---

## H. Customer Registration and Business Approval

**Actors:** Buyer (applicant), Super Admin · **Trigger:** institution visits buyer registration.

1. Buyer submits: organization name and type (school / academy / college /
   retailer / other), contact person, address(es), and business details
   (GST/registration documents — verification requirements `PENDING CONFIRMATION`).
2. Account is created in **Pending Approval**; buyer can log in to see status only
   (catalog visibility pre-approval: P-03, `PENDING CONFIRMATION`).
3. Super Admin reviews in the buyer approval queue → Approve / Request changes / Reject,
   mirroring Workflow A semantics, with reasons recorded.
4. On approval, the buyer gains catalog, pricing and ordering access and receives
   a welcome notification.

**Outcome:** a verified institutional buyer able to transact.

---

## I. Customer Product Browsing and Pricing

**Actors:** Buyer · **Trigger:** approved buyer enters the catalog.

1. Buyer browses the **admin-curated catalog** by sport category (the twelve
   launch categories), with search and filters (brand, price range, specifications).
2. Product detail shows images, specifications, brand/manufacturer, and the
   buyer's **applicable selling price**, computed by the system from the
   admin-set base selling price and the buyer's effective discount — their
   buyer-category default, or an individual override assigned by admin
   (confirmed model, OBD-05). Exactly **one** discount applies per calculation:
   an individual discount, where assigned, **completely replaces** the category
   default — the two are never added together (confirmed — OBD-20 Individual
   Override). The applicable discount applies **before GST**: GST is calculated
   on the discounted taxable value and added to reach the final payable amount
   (confirmed — OBD-20 Option A). Displayed prices are **GST-inclusive**
   (confirmed — OBD-20 Customer Price Display), with the GST breakdown shown
   separately at checkout. **Promotional discounts** are supported but never
   combine with other discounts, and an individual discount takes priority
   over a promotional one (confirmed — OBD-20). Monetary values use
   two-decimal precision; price changes are immediate or scheduled, and
   confirmed orders retain their original prices (confirmed — OBD-20).
   Percentages, GST rates/HSN classification, rounding method and
   promo-vs-category precedence: ◇ PROPOSED / `PENDING CONFIRMATION`, OBD-20.
3. Availability is shown as an indicator derived from warehouse stock
   (presentation: P-06, `PENDING CONFIRMATION`).
4. Buyers see **only** ProSmash as the seller — no supplier identity or
   procurement cost ever appears.
5. Catalog content (publication, naming, imagery, price) is governed solely by
   Super Admin.

**Outcome:** buyer finds products and trustworthy pricing, or proceeds to Workflow K if not found.

---

## J. Customer Order Placement

**Actors:** Buyer, Super Admin · **Trigger:** buyer decides to purchase.

1. Buyer builds an order (cart) from catalog items with quantities
   (minimum-quantity rules: `PENDING CONFIRMATION`).
2. Buyer confirms delivery address, reviews totals — line prices are the
   buyer's applicable selling prices per OBD-05, GST-inclusive as displayed,
   computed discount-before-GST: GST on the discounted taxable value, added to
   reach the payable amount (confirmed — OBD-20). **GST details are shown
   separately at checkout** (confirmed — OBD-20 Customer Price Display); GST
   rates/HSN, CGST/SGST-vs-IGST determination and invoice specifics
   `PENDING CONFIRMATION` (OBD-11/OBD-20) — and submits the order.
3. Order enters **Placed** state; **available warehouse stock for its
   warehouse-fulfillable lines is reserved at placement** (confirmed —
   OBD-21); buyer receives confirmation with order number.
4. Payment policy (confirmed, OBD-08): **100% advance payment** — the full
   order amount must be paid and confirmed **before dispatch**; no postpaid or
   credit facilities. Workflow M governs collection; accepted methods and
   failed-payment handling are `PENDING CONFIRMATION` (OBD-21).
5. Super Admin reviews the order and determines the **fulfilment method per
   order line** under the hybrid model (OBD-01): from ProSmash warehouse stock
   (already reserved at placement, Workflow L) and/or supplier direct
   shipment — selectable
   only for lines where both the supplier is direct-shipment approved and the
   product is direct-shipment enabled (OBD-19 Option C). For direct-shipment
   lines, admin determines the applicable **shipping charge per order**,
   considering supplier, product and buyer (OBD-19 Option D; who bears the
   charge and how it appears on invoices: `PENDING CONFIRMATION`). Admin then
   **Confirms** the order, or contacts the buyer about issues (stock shortfall,
   pricing errors); admin may adjust or cancel with reason.
6. If stock is insufficient and no direct-shipment arrangement exists, admin may
   trigger a procurement requirement (Workflow C) and set buyer expectations on
   timeline.
7. Buyer tracks status throughout: Placed → Confirmed → Processing → Dispatched →
   Delivered (statuses finalized in the data model phase).
8. Delivery issues — delayed, damaged, lost or missing shipments — are reported
   by the buyer **to ProSmash only**, regardless of fulfilment method; ProSmash
   is the single customer-facing contact and coordinates resolution with the
   supplier and courier internally (confirmed — OBD-19 Option B; compensation,
   replacement and refund policies: `PENDING CONFIRMATION`).
9. Cancellation/modification windows for buyers: P-08, `PENDING CONFIRMATION`.

**Outcome:** a confirmed order ready for warehouse fulfilment.

---

## K. Requests for Products Not Available in the Catalogue

**Actors:** Buyer, Super Admin · **Trigger:** buyer cannot find a product.

1. Buyer submits a **Product Request**: product description, category, desired
   specifications, quantity, needed-by date, optional reference images/links.
2. Request is logged with a tracking ID; buyer sees it in "My Requests" with status.
3. Super Admin reviews the request and responds:
   - **Already available** → point the buyer to the existing product; or
   - **Will source** → convert the request into a Procurement Requirement
     (Workflow C), keeping the link for traceability; or
   - **Declined** → with a recorded reason communicated to the buyer.
4. When sourcing succeeds and the product is published, the buyer is notified
   the item is now orderable (whether a price/offer is first proposed privately
   to the requesting buyer: `PENDING CONFIRMATION`).
5. Aggregation: admin can merge similar requests from multiple buyers into one
   requirement to gain volume.

**Outcome:** unmet demand is captured and routed into the procurement pipeline.

---

## L. Warehouse Inventory and Order Fulfilment

**Actors:** Super Admin (warehouse operations) · **Trigger:** goods arrive from suppliers, or a buyer order is confirmed.

> Hybrid model (OBD-01): this workflow applies to **warehouse-fulfilled order
> lines** only. Direct-shipment lines bypass the warehouse and are tracked under
> Workflow N (supplier dispatches to the buyer); delivery is confirmed via
> supplier proof + buyer confirmation (OBD-19 Option C), with edge cases
> `PENDING CONFIRMATION` (OBD-19).

**Inbound (from Workflow N):**
1. Against an open PO, record **goods receipt**: quantities received, condition,
   discrepancies (short/damaged — handled via Workflow N step 4).
2. Accepted stock increases **on-hand inventory** at the warehouse
   (single warehouse assumed in phase 1: `PENDING CONFIRMATION`, OBD-10).
3. Quality check policy before stock becomes sellable: `PENDING CONFIRMATION`.

**Outbound (from Workflow J):**
4. Available stock is **reserved at order placement** (confirmed — OBD-21),
   with on-hand vs reserved vs available tracked separately; the reservation
   is **released** if the order is cancelled on payment timeout or by admin.
5. Warehouse picks and packs; order moves to **Processing**, then **Dispatched**
   with transport details (carrier handling and integrations: out of scope phase 1,
   recorded manually; `PENDING CONFIRMATION`).
6. Delivery is confirmed (manual confirmation vs buyer acknowledgement:
   `PENDING CONFIRMATION`); order reaches **Delivered**.

**Controls:**
7. Manual stock adjustments (damage, loss, count corrections) require a reason
   and are audit-logged.
8. Low-stock indicators per product support procurement planning (thresholds:
   `PENDING CONFIRMATION`).

**Outcome:** accurate stock positions; buyer orders fulfilled from ProSmash inventory.

---

## M. Customer Payment Collection

**Actors:** Buyer, Super Admin (finance) · **Trigger:** order placement/confirmation per payment policy.

1. Payment policy (confirmed — **OBD-08**): **100% advance payment** on every
   order. The full order amount must be paid before dispatch; ProSmash offers no
   postpaid or institutional credit facilities.
2. System generates the **payment obligation** (full order amount, GST
   included) against each order; every order carries a **payment status** at
   all times (e.g. Unpaid → Payment Confirmed; exact status set finalized in
   the data model phase). Customer invoices show the applicable **GST
   breakdown** (confirmed — OBD-20 Customer Price Display); invoice timing,
   format and credit-note compliance: `PENDING CONFIRMATION` (OBD-11/OBD-20/OBD-21).
3. Buyer pays via the supported methods (confirmed — OBD-21): **UPI,
   credit/debit cards, Net Banking, NEFT/RTGS, or cheque**. Verification
   splits by method:
   - **Online payments** (UPI / cards / Net Banking) are **automatically
     verified through the payment gateway** (gateway selection:
     `PENDING CONFIRMATION`, OBD-21 — an architecture-phase decision).
   - **NEFT/RTGS and cheque payments** require the buyer to **upload payment
     proof**, and count as confirmed only after **Super Admin verification**.
4. **Failed payments** may be retried; a **configurable timeout** cancels the
   unpaid order and releases its stock reservation (timeout default values:
   ◇ PROPOSED, OBD-21). Super Admin reconciles received payments against
   orders with full transaction visibility (reconciliation detail: ◇ PROPOSED,
   OBD-21).
5. **Dispatch gate (confirmed):** no order — warehouse-fulfilled or supplier
   direct-shipment — is dispatched until payment of 100% of the order amount is
   successfully confirmed. "Confirmed" means gateway auto-verification for
   online payments, and Super Admin verification of uploaded proof for
   NEFT/RTGS and cheque payments (confirmed — OBD-21, step 3 above).
6. Buyer sees payment status, history and downloadable invoices/receipts in the portal.
7. **Refunds** (confirmed — OBD-21): refund rules are configurable by Super
   Admin; the **original payment method is the default refund destination**,
   with bank transfer available as an **admin-approved exception**. Refund
   triggers and timelines beyond this: ◇ PROPOSED / `PENDING CONFIRMATION`
   (OBD-19/OBD-21).

**Outcome:** every rupee owed by buyers is tracked to an order and reconciled.

---

## N. Supplier Order Fulfilment and Payment Tracking

**Actors:** Supplier, Super Admin · **Trigger:** PO issued at award (Workflow G).

**Fulfilment:**
1. Supplier **acknowledges** the PO (or raises an issue) within the
   acknowledgement window. The PO states the fulfilment destination:
   **ProSmash warehouse** or **direct-to-buyer** — the latter possible only
   because admin has approved this supplier for direct shipment and enabled the
   product (OBD-19 Option C); suppliers can never choose or enable it
   themselves, and never determine or change the shipping charge — charges are
   admin-set per order (OBD-19 Option D). Suppliers can view their own
   eligibility status in the portal.
2. Supplier fulfils: updates expected dispatch date, marks **Dispatched** with
   transport/document details (invoice, e-way bill — document requirements
   `PENDING CONFIRMATION`), and quantity shipped (partial shipments allowed:
   `PENDING CONFIRMATION`). For **direct-to-buyer POs**, dispatch is released
   only after the buyer's 100% advance payment is confirmed (OBD-08) — how this
   gate is communicated to the supplier: `PENDING CONFIRMATION` (OBD-19).
3. Receipt confirmation depends on destination:
   - **Warehouse POs:** admin records goods receipt at the warehouse
     (Workflow L inbound); the PO tracks ordered vs received quantities.
   - **Direct-shipment POs** (confirmed — OBD-19 Option C, Supplier Proof +
     Buyer Confirmation): the supplier **uploads delivery proof** (POD,
     delivery photographs or signed receipt); **only after** proof is uploaded
     (Proof-First Sequence, OBD-19 Option A) does the buyer receive a
     **delivery confirmation request through ProSmash**, and confirms receipt
     on the website; Super Admin can review both the proof and the buyer
     confirmation. Both events are recorded against the PO and the buyer
     order. Buyer non-response, disputed or partial deliveries, confirmation
     deadlines, admin manual resolution, and POD validation/retention rules:
     ◇ PROPOSED / `PENDING CONFIRMATION` (OBD-19). The supplier receives only
     the **minimum delivery information** (confirmed — OBD-19): recipient
     name, phone, delivery address, product, quantity, delivery instructions
     and PO reference — nothing else about the buyer or order.
4. Discrepancies (short delivery, damage, spec mismatch) are logged against the
   PO; resolution (replacement, debit note, PO amendment) is recorded —
   resolution policy: `PENDING CONFIRMATION`.
   For **direct-shipment delivery complaints** (delayed, damaged, lost or
   missing), ProSmash handles the buyer relationship exclusively (OBD-19
   Option B): admin logs the complaint against the order and PO, coordinates
   investigation and resolution with the supplier and courier, and manages
   supplier/courier accountability internally. Suppliers must not redirect
   buyers or resolve complaints with them directly. Legal liability, financial
   recovery, compensation, replacement and refund policies:
   `PENDING CONFIRMATION` (OBD-19).
5. PO closes when fully received (or closed short with reason).

**Payment tracking:**
6. Supplier payment terms come from the awarded quotation (advance, on-delivery,
   net-X days — allowed terms: `PENDING CONFIRMATION`).
7. System tracks payables per PO: amount due, due date, amounts paid; Super Admin
   records payments made (payment execution is off-platform via bank;
   on-platform payout integration: `PENDING CONFIRMATION`).
8. Supplier sees, for each PO: fulfilment status, amounts invoiced, amounts
   received, and outstanding balance — their complete money trail with ProSmash.
9. Supplier fulfilment performance (on-time, in-full, discrepancy rate) is
   recorded and feeds future quotation comparisons (Workflow G).

**Outcome:** supplier obligations and ProSmash payables fully tracked from PO to settlement.

---

## Workflow Interconnection Map

```
K (buyer request) ──┐
Stock planning ─────┼──► C (requirement) ──► D (notify) ──► E (quotations ⇄ revisions)
J (order, no stock)─┘                                            │
                                                                 ▼
                                   F (negotiation) ◄──────► G (compare & award)
                                                                 │ PO
                                                                 ▼
B (supplier catalog) ─ informs sourcing                N (supplier fulfilment) ──► L (inbound)
                                                            │                         │ stock
A (supplier approval) ─ gates D/E/F/G/N                     │ direct shipment         ▼
H (buyer approval) ─ gates I/J/K/M          I (browse) ──► J (order) ──► L (outbound) ──► delivery
                                                              ▲             (warehouse lines)
                                                              └── direct-shipment lines delivered
                                                                  by supplier (N, OBD-19)
                                                              │
                                                              ▼
                                                      M (buyer payment)
                                            N (supplier payment) ◄─ settlement
```
