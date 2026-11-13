# ProSmash — Functional Requirements

> Status: Draft for owner review · Last updated: 2026-11-13
>
> ID scheme: `ADM-xxx` Super Admin Portal · `SUP-xxx` Supplier Portal ·
> `BUY-xxx` Business Buyer Portal · `PLT-xxx` cross-portal/platform.
> Status values: **Confirmed** (follows approved business rules),
> **◇ PROPOSED** (a recommended approach recorded in
> `OPEN-BUSINESS-DECISIONS.md`, awaiting owner approval — never to be treated
> as decided), or **`PENDING CONFIRMATION`** (behaviour depends on an open
> decision — see `OPEN-BUSINESS-DECISIONS.md` references like OBD-05).
> Workflow references (A–N) point to `BUSINESS-WORKFLOWS.md`.

---

## 1. Super Admin Portal (ADM)

### ADM-001 — Supplier approval queue _(Workflow A · Confirmed)_
The portal shall provide a queue of supplier applications with submitted details
and documents, and actions Approve / Request changes / Reject (reason mandatory
for the latter two).
- **AC1:** Approving transitions the supplier to Active and notifies them.
- **AC2:** Rejecting/requesting changes stores the reason and notifies the supplier.
- **AC3:** Every decision records actor and timestamp in an audit trail.

### ADM-002 — Buyer approval queue _(Workflow H · Confirmed)_
Equivalent approval queue for business buyer applications with the same action
set and audit behaviour.
- **AC1–AC3:** as ADM-001, applied to buyer accounts.

### ADM-003 — Account suspension and reactivation _(Confirmed)_
Admin shall be able to suspend and reactivate any supplier or buyer account with
a recorded reason.
- **AC1:** Suspended accounts cannot use transactional features.
- **AC2:** Suspension/reactivation is audit-logged and notifies the account.
- **AC3:** Effect on in-flight quotations/orders follows P-09/P-10 — `PENDING CONFIRMATION`.

### ADM-004 — Category management _(Confirmed)_
Admin shall manage the sport category tree (the 12 launch categories, extensible),
controlling naming, ordering, visibility and imagery.
- **AC1:** New categories become available for products, supplier subscriptions and requirements.
- **AC2:** A category with live products/requirements cannot be deleted, only hidden.

### ADM-005 — Catalog product management _(Workflow I · Confirmed)_
Admin shall create and edit buyer-facing products: name, category, brand,
specifications, images, and publication state (Draft/Published/Hidden).
- **AC1:** Only Published products appear to buyers.
- **AC2:** Products link optionally to originating POs/suppliers, visible to admin only.
- **AC3:** Edits to published products apply without breaking existing orders.

### ADM-006 — Buyer-facing price and discount management _(Workflow I · Confirmed — OBD-05; mechanics PENDING CONFIRMATION — OBD-20)_
Admin shall set the **base selling price** per product, configure **default
discount percentages per buyer category**, and assign **special discount
percentages to individual buyers** that override their category default. The
system computes each buyer's applicable selling price with the discount applied
**before GST**: GST is calculated on the discounted taxable value and added to
reach the final payable amount, and buyer-facing prices are displayed
GST-inclusive (confirmed — OBD-20; subject to tax-professional validation).
Actual percentages, GST rates/HSN classification, storage and display
precision, promotional discounts, rounding, CGST/SGST-vs-IGST, validity and
approval authority follow OBD-20 — `PENDING CONFIRMATION`.
- **AC1:** Base-price and discount changes are versioned with effective timestamps.
- **AC2:** Orders capture the computed applicable price at placement time,
  immune to later changes.
- **AC3:** An individual buyer discount, where set, **completely replaces** the
  category default; the system never adds the two together, and exactly one
  applicable discount enters each buyer-and-product calculation — with none
  assigned, the category default applies (confirmed — OBD-20 Individual
  Override; promotional-discount interaction `PENDING CONFIRMATION`).
- **AC4:** Purchase costs, base prices, discounts and margins are visible in the
  Super Admin Portal only.
- **AC5:** Promotional discounts are supported but never combine with any
  other discount; an individual discount takes priority over a promotional
  one (confirmed — OBD-20; promo-vs-category precedence ◇ PROPOSED).
- **AC6:** All monetary values use two-decimal precision (confirmed — OBD-20;
  rounding method ◇ PROPOSED, accountant validation required).
- **AC7:** Price and discount changes can be applied immediately or scheduled
  for an effective date/time; existing confirmed orders always retain their
  original captured prices (confirmed — OBD-20).
- **AC8:** Only Super Admin can approve customer-facing selling-price changes;
  supplier purchase-cost proposals (SUP-012) have no effect until admin
  acceptance (confirmed — OBD-20).

### ADM-007 — Procurement requirement management _(Workflow C · Confirmed)_
Admin shall create, edit, publish, amend, close and cancel procurement
requirements as specified in Workflow C.
- **AC1:** Draft → Open → Closed/Cancelled lifecycle is enforced; only Open
  requirements accept quotations.
- **AC2:** Publishing triggers category-matched notifications (ADM-008/SUP-005).
- **AC3:** Amendments notify all suppliers who quoted; origin links (order/request) are preserved.

### ADM-008 — Supplier matching and invitation visibility _(Workflow D · Confirmed)_
For each requirement, admin shall see which suppliers were matched/notified and
which have viewed or quoted.
- **AC1:** Matched list derives from served categories at publication time.
- **AC2:** Hand-picking additional suppliers beyond category match — `PENDING CONFIRMATION` (OBD-06).

### ADM-009 — Quotation inbox and version history _(Workflow E · Confirmed)_
Admin shall view all quotations per requirement with complete version history
and change highlights between versions.
- **AC1:** Latest version is default; any prior version is inspectable.
- **AC2:** Withdrawn quotations remain visible, marked withdrawn.

### ADM-010 — Negotiation messaging _(Workflow F · Confirmed)_
Admin shall message any quoting supplier in a private per-requirement thread,
with attachments and a formal "request revision" action.
- **AC1:** Threads are isolated per supplier; no cross-visibility.
- **AC2:** Messages are immutable and timestamped; threads auto-close on award/cancel
  but remain readable.
- **AC3:** Revision requests appear to the supplier as actionable items (SUP-007).

### ADM-011 — Quotation comparison and award _(Workflow G · Confirmed)_
Admin shall compare latest quotations side by side (price, quantity, lead time,
validity, terms, supplier performance signals) and select winner(s).
- **AC1:** Award generates PO(s) capturing the winning version's terms verbatim.
- **AC2:** Winners and non-winners are notified per Workflow G.
- **AC3:** Split awards — `PENDING CONFIRMATION` (OBD-07).
- **AC4:** Award rationale note is stored and auditable.

### ADM-012 — Purchase order management _(Workflow N · Confirmed)_
Admin shall track POs end to end: acknowledgement, dispatch, receipt, discrepancies, closure.
- **AC1:** PO shows ordered vs dispatched vs received quantities at all times.
- **AC2:** Discrepancies require a logged reason and resolution record
  (resolution policy `PENDING CONFIRMATION` — OBD-12).

### ADM-013 — Goods receipt _(Workflow L · Confirmed)_
Admin shall record goods receipts against POs: quantities, condition, discrepancies.
- **AC1:** Accepted quantities increase on-hand stock atomically.
- **AC2:** A receipt cannot exceed PO open quantity without an override reason.

### ADM-014 — Inventory management _(Workflow L · Confirmed)_
The portal shall track on-hand, reserved, and available stock per product, with
manual adjustments requiring a reason.
- **AC1:** Available = on-hand − reserved, always consistent with order reservations.
- **AC2:** Every adjustment is audit-logged with actor, reason, delta.
- **AC3:** Low-stock indicators per product (thresholds `PENDING CONFIRMATION`).

### ADM-015 — Buyer order management _(Workflows J, L · Confirmed)_
Admin shall review, confirm, adjust, fulfil and cancel buyer orders, driving the
status lifecycle through dispatch and delivery. Under the hybrid model (OBD-01),
admin designates the fulfilment method per order line: warehouse stock, or
supplier direct shipment where the supplier-and-product eligibility flags allow
it (OBD-19 Option C, managed via ADM-020).
- **AC1:** Available warehouse stock for warehouse-fulfillable lines is
  reserved **at order placement** (confirmed — OBD-21); cancellation —
  including automatic cancellation on payment timeout — releases the
  reservation. Direct-shipment lines reserve no warehouse stock.
- **AC2:** Status changes notify the buyer and are audit-logged.
- **AC3:** Insufficient stock surfaces a direct "create procurement requirement" path (Workflow C).
- **AC4:** No order (warehouse or direct-shipment) can transition to Dispatched
  until its payment status is Confirmed at 100% of the order amount (OBD-08).

### ADM-016 — Buyer payment management _(Workflow M · Confirmed — OBD-08/OBD-21; details PROPOSED/PENDING)_
Admin shall see the full-amount payment obligation per order (100% advance
policy), verify offline payments, reconcile all payments, view every customer
payment transaction, and view outstanding unpaid orders per buyer.
- **AC1:** Recorded payments update order payment state immediately; every
  order has a payment status at all times.
- **AC2:** The dispatch gate (ADM-015 AC4) is enforced by the system, not by
  operator discipline; overrides, if any exist, are `PENDING CONFIRMATION` (OBD-21).
- **AC3:** Admin can view the complete transaction history per order and per
  buyer (reconciliation detail ◇ PROPOSED — OBD-21).
- **AC4:** Online payments (UPI/cards/Net Banking) are verified automatically
  via the gateway; NEFT/RTGS and cheque payments present the buyer's uploaded
  proof for admin verification, and count as confirmed only on admin approval
  (confirmed — OBD-21).
- **AC5:** Unpaid orders auto-cancel at the configurable payment timeout,
  releasing stock reservations; admin can see orders approaching timeout
  (default timeout values ◇ PROPOSED — OBD-21).

### ADM-017 — Supplier payment tracking _(Workflow N · Confirmed)_
Admin shall track payables per PO (due, paid, outstanding) and record payments made.
- **AC1:** Supplier-visible payment status (SUP-010) always matches admin records.
- **AC2:** Terms originate from the awarded quotation; edits require a reason.

### ADM-018 — Product request handling _(Workflow K · Confirmed)_
Admin shall review buyer product requests and resolve each as Available /
Will source (convert to requirement) / Declined, with reasons.
- **AC1:** Conversion preserves a request↔requirement link for traceability.
- **AC2:** Similar requests can be merged into one requirement; all requesters stay linked.
- **AC3:** Resolution notifies the requesting buyer(s).

### ADM-019 — Dashboards and audit _(Confirmed)_
Admin shall have an operational dashboard (pending approvals, open requirements,
quotations awaiting review, orders by status, low stock, overdue payments) and a
searchable audit log of sensitive actions.
- **AC1:** Each dashboard figure links to its filtered list.
- **AC2:** Audit log covers approvals, awards, price changes, stock adjustments, payments.

### ADM-020 — Direct-shipment eligibility management _(Workflows G, J, N · Confirmed — OBD-19 Option C; criteria PENDING CONFIRMATION)_
Admin shall approve/revoke **suppliers** for direct-shipment eligibility and
separately enable/disable **direct shipment per product**. Both settings are
exclusively admin-controlled.
- **AC1:** A direct-to-buyer fulfilment option (PO destination or order-line
  method) is offered only when the supplier is approved AND the product is
  enabled; either flag off blocks it.
- **AC2:** Suppliers have no interface to set, request-free change, or override
  either flag.
- **AC3:** Flag changes are audit-logged (actor, timestamp, reason) and do not
  retroactively alter in-flight POs/orders (in-flight handling on revocation:
  `PENDING CONFIRMATION` — OBD-19).
- **AC4:** Supplier eligibility evaluation criteria and approval procedure
  follow OBD-19 — `PENDING CONFIRMATION`.
- **AC5:** Suppliers can view their own eligibility status (read-only) in the
  Supplier Portal (confirmed — OBD-19).

### ADM-021 — Direct-shipment shipping charge management _(Workflows J, N · Confirmed — OBD-19 Option D; economics PENDING CONFIRMATION)_
Admin shall determine the shipping charge for each direct-to-buyer order
individually, with supplier, product and buyer context available at the point
of decision. Suppliers have no ability to set or change charges.
- **AC1:** Each direct-shipment order line/consignment carries an admin-set
  shipping charge decided per order.
- **AC2:** The charge-determination view presents the relevant supplier,
  product and buyer context.
- **AC3:** Who bears the charge, calculation method (fixed / percentage /
  manual), free or subsidized shipping, invoice presentation, and
  multi-supplier order handling follow OBD-19 — `PENDING CONFIRMATION`.
- **AC4:** Shipping charge entries are audit-logged with actor and timestamp.

### ADM-022 — Delivery issue management _(Workflows J, N · Confirmed — OBD-19 Option B; remedies PENDING CONFIRMATION)_
Admin shall receive buyer delivery complaints (delayed, damaged, lost, missing)
for direct-shipment and warehouse orders, log them against the order (and PO
where applicable), and coordinate investigation and resolution with the
relevant supplier and courier. Supplier and courier accountability is managed
internally by ProSmash.
- **AC1:** Every complaint is tracked with status from intake to closure,
  linked to its order and (for direct shipments) its PO.
- **AC2:** All buyer-facing communication on a complaint occurs between
  ProSmash and the buyer — never supplier-to-buyer.
- **AC3:** Internal supplier/courier coordination is recorded against the
  complaint for audit.
- **AC4:** Compensation, replacement, refund, legal liability and financial
  recovery follow OBD-19 — ◇ PROPOSED / `PENDING CONFIRMATION` (legal
  validation required).

### ADM-024 — Refund management _(Workflow M · Confirmed — OBD-21; specifics PROPOSED/PENDING)_
Admin shall process refunds under Super-Admin-configurable refund rules.
- **AC1:** The original payment method is the default refund destination;
  bank transfer is selectable only as an admin-approved exception, with the
  approval recorded (confirmed — OBD-21).
- **AC2:** Every refund links to its order and payment transaction(s) and is
  audit-logged with actor, amount, destination and reason.
- **AC3:** Refund triggers and timelines follow OBD-19/OBD-21 — ◇ PROPOSED /
  `PENDING CONFIRMATION`.

### ADM-023 — Delivery confirmation review _(Workflow N · Confirmed — OBD-19 Option C; edge cases PENDING CONFIRMATION)_
For direct-to-buyer shipments, admin shall review the supplier's uploaded
delivery proof and the buyer's receipt confirmation, with both events recorded
against the PO and the buyer order.
- **AC1:** The review view shows supplier proof (POD / photographs / signed
  receipt) and the buyer confirmation side by side, with timestamps.
- **AC2:** Both proof submission and buyer confirmation are immutably recorded.
- **AC3:** Buyer non-response handling, disputed or partial deliveries,
  confirmation deadlines, and admin manual resolution follow OBD-19 —
  `PENDING CONFIRMATION`.

---

## 2. Supplier Portal (SUP)

### SUP-001 — Registration _(Workflow A · Confirmed)_
The portal shall offer supplier self-registration capturing the fields in
Workflow A step 2, with document upload.
- **AC1:** Submission creates a Pending Approval account and notifies admin.
- **AC2:** Mandatory-field validation; GST/document specifics `PENDING CONFIRMATION` (OBD-02).

### SUP-002 — Application status visibility _(Workflow A · Confirmed)_
Pending/rejected suppliers shall see their application status, admin-requested
changes, and be able to resubmit.
- **AC1:** Pre-approval accounts reach no transactional features.
- **AC2:** Resubmission returns the application to the admin queue.

### SUP-003 — Profile management _(Workflow B · Confirmed)_
Approved suppliers shall maintain profile, contacts, documents and served categories.
- **AC1:** Sensitive-field edits route to admin re-review (field list
  `PENDING CONFIRMATION`); routine edits apply immediately.
- **AC2:** Category changes take effect on future requirement matching.

### SUP-004 — Supply catalog management _(Workflow B · Confirmed)_
Suppliers shall maintain supply-catalog items (name, category, brand, specs,
images, capacity, lead time).
- **AC1:** Items are visible to admin for sourcing; never to buyers.
- **AC2:** Indicative pricing field — `PENDING CONFIRMATION` (OBD-04).

### SUP-005 — Requirement notifications and list _(Workflow D · Confirmed)_
Suppliers shall be notified of requirements matching their categories and see
all such open requirements in a list with deadlines.
- **AC1:** Notification = in-portal + email on publication and amendment.
- **AC2:** Non-matching requirements are never visible.

### SUP-006 — Quotation submission _(Workflow E · Confirmed)_
Suppliers shall submit quotations on open requirements with the fields in
Workflow E step 1, including attachments.
- **AC1:** Submission is confirmed to the supplier and visible to admin only.
- **AC2:** Quoting is blocked after the deadline/closure (late exception
  `PENDING CONFIRMATION`).

### SUP-007 — Quotation revisions and withdrawal _(Workflow E · Confirmed)_
Suppliers shall submit revisions (self-initiated while open; on request after),
see their own version history, and withdraw before award.
- **AC1:** Each revision is a new immutable version; history lists all versions.
- **AC2:** Admin revision requests appear as actionable notifications.
- **AC3:** Withdrawal is recorded and removes the quotation from award eligibility.

### SUP-008 — Negotiation messaging _(Workflow F · Confirmed)_
Suppliers shall exchange messages/attachments with admin in their private
thread per requirement.
- **AC1:** Only own threads are visible; no other supplier is ever referenced.
- **AC2:** Closed threads remain readable.

### SUP-009 — PO acknowledgement and fulfilment _(Workflow N · Confirmed)_
Suppliers shall see awarded POs, acknowledge or raise issues, and update
dispatch details and quantities. Each PO states its fulfilment destination:
ProSmash warehouse or direct-to-buyer (hybrid model, OBD-01). Direct-to-buyer
appears only when admin has approved the supplier and enabled the product
(OBD-19 Option C); suppliers cannot enable it themselves, can view their own
eligibility status read-only, and never determine or change shipping charges
(admin-set per order — OBD-19 Option D). For direct shipments, suppliers must
not interact with buyers on delivery complaints or redirect buyers to resolve
them independently — all complaint handling runs through ProSmash (OBD-19
Option B). A direct-to-buyer PO discloses **only** the minimum delivery
information: recipient name, phone, delivery address, product, quantity,
delivery instructions and PO reference (confirmed — OBD-19). Shipping-charge
economics, legal liability and financial recovery remain ◇ PROPOSED /
`PENDING CONFIRMATION` — OBD-19.
- **AC1:** PO terms display exactly the awarded quotation version, including destination.
- **AC2:** Dispatch updates (date, transport, documents, quantity) are visible
  to admin in real time; partial-shipment policy `PENDING CONFIRMATION`.
- **AC3:** For direct-to-buyer POs, the supplier shall upload delivery proof —
  POD, delivery photographs or signed receipts (OBD-19 Option C); proof
  submission is recorded against the PO (validation and retention rules
  `PENDING CONFIRMATION` — OBD-19).

### SUP-010 — Payment visibility _(Workflow N · Confirmed)_
Suppliers shall see per-PO financials: invoiced, received, outstanding, and due dates.
- **AC1:** Figures mirror admin records (ADM-017) exactly.
- **AC2:** Payment history is exportable/downloadable.

### SUP-011 — Award outcome visibility _(Workflow G · PENDING CONFIRMATION — OBD-07)_
Suppliers shall be informed of requirement outcomes; whether non-winners see
"not selected" vs. "requirement closed" is undecided.
- **AC1:** Winners see the PO immediately on award.

### SUP-012 — Purchase-cost change proposals _(Workflow B · Confirmed — OBD-20)_
Suppliers shall be able to propose purchase-cost changes for items they
supply; proposals take effect only on Super Admin acceptance.
- **AC1:** A proposal carries the item, current cost context, proposed cost
  and effective-date request, and is visible to admin for decision.
- **AC2:** Until accepted, nothing changes anywhere; rejection is recorded
  with a reason visible to the supplier.
- **AC3:** Acceptance never alters customer-facing selling prices — those
  change only through admin price management (ADM-006).

---

## 3. Business Buyer Portal (BUY)

### BUY-001 — Registration _(Workflow H · Confirmed)_
The portal shall offer organizational buyer registration per Workflow H step 1,
with document upload.
- **AC1:** Submission creates a Pending Approval account and notifies admin.
- **AC2:** Verification requirements `PENDING CONFIRMATION` (OBD-02).

### BUY-002 — Application status visibility _(Workflow H · Confirmed)_
Pending/rejected buyers shall see status and requested changes, and resubmit.
- **AC1:** Pending accounts browse the public catalog at standard listed
  prices like any visitor; discounted prices appear only after approval
  (confirmed — OBD-03). Ordering remains approval-gated.

### BUY-003 — Catalog browsing and search _(Workflow I · Confirmed — OBD-03)_
The catalog shall be publicly browsable by the 12 sport categories, with
search and filtering (brand, price, specifications), for anonymous visitors
and buyers alike; the buyer portal presents the same catalog to logged-in
buyers.
- **AC1:** Only Published products appear.
- **AC2:** Search covers name, brand, category and key specifications.
- **AC3:** No supplier identity, procurement cost, margin or discount data is
  ever exposed on public pages or to any role beyond its permissions.

### BUY-004 — Product detail and pricing _(Workflow I · Confirmed — OBD-03/OBD-05; display mechanics PENDING CONFIRMATION — OBD-20)_
Product pages shall show images, specifications and brand to everyone, with
pricing tiered by session (OBD-03): anonymous visitors and
registered-but-unapproved buyers see the **standard listed selling price**
(base price, GST-inclusive); **approved, logged-in buyers** additionally see
their **applicable discounted selling price** — the system-computed result of
base price and the buyer's effective discount (category default or individual
override).
- **AC1:** Displayed price is the price captured if ordered now.
- **AC2:** Buyers never see other buyers' prices or discounts, purchase costs
  or margins. The standard listed price is public (OBD-03), so a logged-in
  buyer can see standard vs. their own discounted price; whether their
  discount % is displayed explicitly is `PENDING CONFIRMATION` — OBD-20.
- **AC3:** Displayed prices are **GST-inclusive** (confirmed — OBD-20 Customer
  Price Display); product-wise GST rates/HSN and display precision
  `PENDING CONFIRMATION` (OBD-20/OBD-11).
- **AC4:** Availability indicator per P-06 — `PENDING CONFIRMATION`.

### BUY-005 — Order placement _(Workflow J · Confirmed)_
Buyers shall build a multi-line order, set quantities, choose a delivery
address, review GST-itemized totals, and submit.
- **AC1:** Order confirmation shows an order number and captured prices.
- **AC2:** Minimum-quantity enforcement `PENDING CONFIRMATION` (OBD-09).
- **AC3:** Order totals are computed discount-before-GST — GST on the
  discounted taxable value (OBD-20 Option A) — and the **GST breakdown is
  shown separately at checkout** (confirmed — OBD-20 Customer Price Display);
  rates/HSN, CGST/SGST-vs-IGST and itemization specifics follow OBD-11/OBD-20
  — `PENDING CONFIRMATION`.

### BUY-006 — Order tracking and history _(Workflows J, L · Confirmed)_
Buyers shall track each order's status through delivery and browse full order
history with documents.
- **AC1:** Status changes generate buyer notifications.
- **AC2:** Order detail shows lines, quantities, prices, payments and documents.
- **AC3:** Cancellation/modification self-service follows P-08 — `PENDING CONFIRMATION`.

### BUY-007 — Product requests _(Workflow K · Confirmed)_
Buyers shall submit requests for unlisted products (description, category,
specs, quantity, needed-by, references) and track their status.
- **AC1:** Each request has a tracking ID and status visible in "My Requests".
- **AC2:** Resolution (available / sourcing / declined) notifies the buyer with any admin note.
- **AC3:** When a sourced product is published, the requester is notified it is orderable.

### BUY-008 — Payments and invoices _(Workflow M · Confirmed — OBD-08/OBD-21; details PROPOSED/PENDING)_
Buyers shall pay **100% of the order amount in advance** via **UPI,
credit/debit cards, Net Banking, NEFT/RTGS or cheque** (confirmed — OBD-21),
see each order's payment status, and download GST-compliant invoices and
receipts showing the applicable GST breakdown (confirmed — OBD-20; invoice and
credit-note compliance details `PENDING CONFIRMATION` — OBD-11/OBD-20).
- **AC1:** Payment status updates promptly after payment/recording and is
  visible on every order.
- **AC2:** The portal makes clear that dispatch occurs only after full payment
  is confirmed; no credit or postpaid option is offered or implied.
- **AC3:** Online payments confirm automatically via the gateway; for
  NEFT/RTGS and cheque payments the buyer uploads payment proof and the
  status shows "awaiting admin verification" until approved (confirmed — OBD-21).
- **AC4:** Failed payments can be retried until the configurable timeout, after
  which the order auto-cancels with clear notice to the buyer; refunds default
  to the original payment method (confirmed — OBD-21; timeout defaults and
  refund specifics ◇ PROPOSED).

### BUY-009 — Organization profile _(Confirmed)_
Buyers shall maintain organization details, delivery addresses, and users
(multi-user pending P-02).
- **AC1:** Multiple saved delivery addresses, selectable at checkout.
- **AC2:** Sensitive business-detail edits route to admin re-review
  (`PENDING CONFIRMATION`, as supplier equivalent).

### BUY-010 — Delivery issue reporting _(Workflow J · Confirmed — OBD-19 Option B; remedies PENDING CONFIRMATION)_
Buyers shall report delivery issues (delayed, damaged, lost, missing) on an
order directly to ProSmash through the portal and track the complaint's status.
- **AC1:** A complaint can be raised from the order detail, with description
  and supporting photos/documents.
- **AC2:** The buyer sees complaint status updates and resolution outcomes;
  the counterparty shown is always ProSmash, never a supplier or courier.
- **AC3:** Compensation, replacement and refund outcomes follow OBD-19 —
  `PENDING CONFIRMATION`.

### BUY-011 — Delivery receipt confirmation _(Workflow N · Confirmed — OBD-19 Option C; edge cases PENDING CONFIRMATION)_
For direct-shipment orders, the buyer shall receive a delivery confirmation
request through ProSmash and be able to confirm receipt through the website.
- **AC1:** The confirmation request is triggered **only after** the supplier's
  delivery proof is uploaded (Proof-First Sequence — OBD-19 Option A); it
  reaches the buyer in-portal and via notification channels per PLT-002. No
  request is sent while proof is outstanding.
- **AC2:** One-action receipt confirmation from the order detail; the
  confirmation is recorded with timestamp against the order.
- **AC3:** Non-response handling, disputes, partial-delivery treatment and
  confirmation deadlines follow OBD-19 — `PENDING CONFIRMATION`.

---

## 4. Platform / Cross-Portal (PLT)

### PLT-001 — Authentication and portal isolation _(Confirmed)_
Each role shall access only its own portal; sessions, navigation and data are
strictly isolated per the access boundaries in `USER-ROLES-AND-PERMISSIONS.md` §3.
- **AC1:** A credential grants exactly one role's portal.
- **AC2:** Cross-portal data leakage cases in §3 (items 2, 3, 4, 6) are testable and enforced.

### PLT-002 — Notifications _(Workflows D, G, J–N · Confirmed)_
The platform shall deliver in-portal and email notifications for the events
defined across workflows (requirement published/amended, revision requested,
award, order status, payment events, request resolution).
- **AC1:** Every notification links to the relevant portal object.
- **AC2:** Additional channels (SMS/WhatsApp) `PENDING CONFIRMATION` (OBD-13).

### PLT-003 — Audit trail _(Confirmed)_
All approval decisions, awards, price changes, stock adjustments, payment
records and status transitions shall be audit-logged (actor, timestamp, before/after).
- **AC1:** Audit entries are immutable and queryable by admin (ADM-019).

### PLT-004 — Document handling _(Confirmed)_
The platform shall accept document/image uploads where workflows require them
(registration credentials, quotation attachments, dispatch documents) into
application-managed storage (`media/` principle — never `assets/`).
- **AC1:** Uploads are scoped to their owning object and role-visibility rules.
- **AC2:** Allowed types/size limits defined in the architecture phase.

### PLT-005 — India-market compliance baseline _(PENDING CONFIRMATION — OBD-02, OBD-11)_
Registration, invoicing and tax displays shall follow Indian business norms
(GSTIN capture, GST-itemized invoices); exact verification and tax rules await
owner confirmation.
- **AC1:** Once confirmed, rules apply uniformly across portals and documents.

### PLT-006 — Public catalog surface _(Workflow I · Confirmed — OBD-03)_
The platform shall serve the complete published catalog to anonymous visitors:
category browsing, search, product listings and product detail with names,
images, descriptions, specifications and standard listed selling prices
(GST-inclusive).
- **AC1:** No discount, discounted price, buyer-specific data, supplier
  identity, purchase cost or margin is ever present on public pages.
- **AC2:** Public product and category pages are crawlable/indexable
  (SEO-friendly URLs and metadata; specifics in the architecture phase).
- **AC3:** Public pages present registration and sign-in as the path to
  discounted pricing and ordering.
