# ProSmash — UI Preparation Plan

> Status: Planning document for owner review · Last updated: 2026-11-13
> Scope: structure and inventory only — no visual design, no screens, no
> technology choices. Sources: BUSINESS-WORKFLOWS.md (A–N),
> FUNCTIONAL-REQUIREMENTS.md (ADM/SUP/BUY/PLT), USER-ROLES-AND-PERMISSIONS.md,
> OPEN-BUSINESS-DECISIONS.md.
> Design doctrine applies throughout (CLAUDE.md): premium, professional,
> information-dense B2B — no generic AI-template layouts, decorative
> gradients, or excessive rounded cards.

## 1. Three-Portal Structure

| Portal | Audience | Character |
|---|---|---|
| Super Admin | ProSmash operations | Dense operational console: queues, tables, comparison tools, finance views |
| Supplier | Manufacturers, wholesalers, distributors, dealers | Work-focused: requirements in, quotations out, POs, payments |
| Business Buyer | Schools, academies, colleges, retailers, institutions | Professional commerce: catalog, ordering, orders, payments |

Plus a **public surface** (pre-login): landing page, the **full public
catalog with standard listed prices** (confirmed — OBD-03: discounts and
discounted prices require login; no supplier/commercial data), buyer/supplier
registration entries, and sign-in.

Access is role-scoped (PLT-001, amended 2026-11-16): buyer, supplier and
public surfaces share one unified website with role-unlocked navigation;
shared screens are limited to the public catalogue, and the Super Admin
application remains fully separate. Data isolation per
`USER-ROLES-AND-PERMISSIONS.md` §3 is unchanged.

## 2. Navigation Hierarchy

### 2.1 Super Admin Portal
```
Dashboard
Approvals
├─ Supplier applications          (ADM-001)
└─ Buyer applications             (ADM-002)
Catalog
├─ Categories                     (ADM-004)
├─ Products                       (ADM-005, direct-ship flag ADM-020)
└─ Pricing & discounts            (ADM-006: base prices, category/individual/promo discounts)
Procurement
├─ Requirements                   (ADM-007, matching ADM-008)
├─ Quotations                     (ADM-009, comparison & award ADM-011)
├─ Negotiations                   (ADM-010)
└─ Purchase orders                (ADM-012, delivery confirmation review ADM-023)
Warehouse
├─ Goods receipt                  (ADM-013)
└─ Inventory                      (ADM-014)
Sales
├─ Orders                         (ADM-015, shipping charges ADM-021)
├─ Product requests               (ADM-018)
└─ Delivery complaints            (ADM-022)
Finance
├─ Buyer payments                 (ADM-016: verification queue, timeouts)
├─ Refunds                        (ADM-024)
└─ Supplier payables              (ADM-017)
Suppliers (directory, eligibility ADM-020, cost proposals SUP-012 review)
Buyers (directory, discounts per buyer)
Settings & Audit log              (ADM-019, PLT-003)
```

### 2.2 Supplier Portal
```
Dashboard
Requirements                      (SUP-005: open, matched to my categories)
My Quotations                     (SUP-006/007: versions, revisions, withdrawals)
Messages                          (SUP-008: negotiation threads)
Purchase Orders                   (SUP-009: acknowledge, dispatch, delivery proof upload)
Payments                          (SUP-010: per-PO financials)
My Catalog                        (SUP-004: supply items; cost-change proposals SUP-012)
Profile                           (SUP-003: org, documents, categories,
                                   direct-shipment eligibility status — read-only)
```
Pre-approval state: a reduced shell showing only application status and
profile completion (SUP-002).

### 2.3 Business Buyer Portal
```
Home (buyer-facing landing after sign-in)
Catalog                           (BUY-003: 12 sport categories, search, filters)
└─ Product detail                 (BUY-004: GST-inclusive applicable price)
Cart & Checkout                   (BUY-005: addresses, GST breakdown, payment)
My Orders                         (BUY-006: tracking, documents;
                                   delivery confirmation BUY-011;
                                   report issue BUY-010)
My Requests                       (BUY-007: unlisted-product requests)
Payments & Invoices               (BUY-008: status, proof upload for NEFT/cheque, invoices)
Organization Profile              (BUY-009: addresses, documents)
```
Pre-approval state: application status shell (BUY-002; catalog visibility
pending OBD-03).

## 3. Screen Inventory

### Public (6)
1. Landing page · 2. Public catalog browse/listing (categories, search,
standard listed prices — OBD-03/PLT-006) · 3. Public product detail (standard
price + register/sign-in CTA) · 4. Buyer registration (multi-step, documents) ·
5. Supplier registration (multi-step, documents) · 6. Sign-in / recovery

### Super Admin (26)
| # | Screen | Requirement(s) |
|---|---|---|
| A1 | Dashboard (operational KPIs + queue links) | ADM-019 |
| A2 | Supplier application queue | ADM-001 |
| A3 | Supplier application review (documents, checklist, decision) | ADM-001, OBD-02 ◇ |
| A4 | Buyer application queue | ADM-002 |
| A5 | Buyer application review | ADM-002, OBD-02 ◇ |
| A6 | Category manager | ADM-004 |
| A7 | Product list | ADM-005 |
| A8 | Product editor (specs, images, publication, direct-ship flag) | ADM-005, ADM-020 |
| A9 | Pricing & discounts (base price, category %, per-buyer overrides, promos) | ADM-006 |
| A10 | Requirement list | ADM-007 |
| A11 | Requirement editor + supplier-match panel | ADM-007/008 |
| A12 | Quotation inbox per requirement (versions) | ADM-009 |
| A13 | Quotation comparison & award | ADM-011 |
| A14 | Negotiation thread view | ADM-010 |
| A15 | PO list + PO detail (ack, dispatch, discrepancies) | ADM-012 |
| A16 | Delivery confirmation review (proof vs buyer confirmation) | ADM-023 |
| A17 | Goods receipt entry | ADM-013 |
| A18 | Inventory overview + adjustments | ADM-014 |
| A19 | Order list + order detail (fulfilment method per line, shipping charge) | ADM-015, ADM-021 |
| A20 | Product request queue (merge, convert, decline) | ADM-018 |
| A21 | Delivery complaint queue + complaint detail | ADM-022 |
| A22 | Buyer payments (verification queue for NEFT/cheque proof, timeouts) | ADM-016 |
| A23 | Refund processing | ADM-024 |
| A24 | Supplier payables (per-PO dues, record payments) | ADM-017 |
| A25 | Supplier / buyer directories + detail (eligibility, discounts, suspension) | ADM-003/020 |
| A26 | Settings + audit log | ADM-019, PLT-003 |

### Supplier (12)
| # | Screen | Requirement(s) |
|---|---|---|
| S1 | Dashboard (open requirements, active quotes, POs, dues) | — |
| S2 | Application status (pre-approval shell) | SUP-002 |
| S3 | Requirement list (matched categories) | SUP-005 |
| S4 | Requirement detail + quote form | SUP-006 |
| S5 | My quotations (version history, revise, withdraw) | SUP-007 |
| S6 | Negotiation thread | SUP-008 |
| S7 | PO list + PO detail (acknowledge, dispatch update) | SUP-009 |
| S8 | Delivery proof upload (direct-ship POs) | SUP-009 AC3 |
| S9 | Payments (per-PO: invoiced, received, outstanding) | SUP-010 |
| S10 | Supply catalog (items + cost-change proposals) | SUP-004, SUP-012 |
| S11 | Profile & documents (incl. eligibility status, read-only) | SUP-003, ADM-020 AC5 |
| S12 | Notifications center | PLT-002 |

### Business Buyer (14)
| # | Screen | Requirement(s) |
|---|---|---|
| B1 | Signed-in home | — |
| B2 | Application status (pre-approval shell) | BUY-002 |
| B3 | Category browse | BUY-003 |
| B4 | Product listing (search + filters) | BUY-003 |
| B5 | Product detail (GST-inclusive price, availability) | BUY-004 |
| B6 | Cart | BUY-005 |
| B7 | Checkout (address, GST breakdown, payment method) | BUY-005, BUY-008 |
| B8 | Payment result / retry / proof upload (NEFT-cheque) | BUY-008 |
| B9 | Order list + order detail (status, documents) | BUY-006 |
| B10 | Delivery confirmation prompt | BUY-011 |
| B11 | Report delivery issue + complaint tracking | BUY-010 |
| B12 | Product request form + My Requests | BUY-007 |
| B13 | Payments & invoices | BUY-008 |
| B14 | Organization profile (addresses, documents) | BUY-009 |

**Total: 58 screens** (6 public + 26 admin + 12 supplier + 14 buyer).
Buyer-portal catalog screens (B3–B5) share structure with the public catalog
screens, adding the logged-in discounted price per OBD-03.

## 4. Primary User Journeys

1. **Supplier onboarding** (Workflow A): register → upload documents → status
   shell → approval → full portal. Key moments: document checklist clarity,
   request-changes loop.
2. **Procure-to-stock** (C→D→E→F→G→N→L): admin creates requirement → supplier
   notified → quote → negotiate/revise → compare → award PO → supplier
   dispatches → goods receipt → stock live. Longest cross-portal journey;
   every artifact (requirement, quote version, message, PO) must interlink.
3. **Buyer onboarding** (Workflow H): mirror of journey 1 for institutions.
4. **Browse-to-paid-order** (I→J→M): public browse at standard listed prices
   → approved buyer signs in for the discounted price (OBD-03) → cart → checkout with GST
   breakdown → pay (online auto-confirm, or proof upload + admin verify) →
   order confirmed. Payment-pending and timeout states need first-class UI;
   the public→signed-in price transition is a key conversion moment.
5. **Direct-shipment delivery** (J→N): admin routes line to supplier →
   supplier dispatches with minimum delivery info → uploads proof → buyer gets
   confirmation request → confirms → admin reviews. Three-portal handshake.
6. **Unlisted product request** (K→C→…→I): buyer requests → admin converts →
   sourced → buyer notified product is orderable. Status transparency is the
   feature.
7. **Delivery complaint** (BUY-010→ADM-022): report with evidence → ProSmash
   investigates → resolution. Buyer must never be pointed at a supplier.
8. **Refund** (M/ADM-024): cancellation/timeout → refund to original method →
   buyer sees status.

## 5. Shared Component Inventory

- **Status chip system** — one visual language for all lifecycles (orders,
  POs, quotations, applications, payments, complaints, requirements).
- **Data table** — sortable, filterable, paginated, column-configurable;
  bulk-selection where queues need it. The admin portal's workhorse.
- **Approval queue pattern** — list + detail-with-checklist + decision bar
  (approve / request changes / reject with reason). Reused for suppliers,
  buyers, payment proofs, cost proposals.
- **Document uploader + viewer** — typed slots, per-document status
  (Submitted/Verified/Rejected/Expired), preview, re-upload (OBD-02 ◇).
- **Version timeline** — quotation revisions, price-change history, audit views.
- **Messaging thread** — negotiation UI with attachment support and
  quotation-version context markers (F).
- **Comparison matrix** — quotations side-by-side (G); built for ~2–8 columns.
- **Money display** — two-decimal ₹ formatting everywhere (OBD-20); explicit
  GST-breakdown block (taxable value, GST, total) for checkout/invoices.
- **Notification center + toast pattern** (PLT-002).
- **Audit metadata footer** — who/when on every reviewable object (PLT-003).
- **Empty states / onboarding illustrations** (assets/illustrations).
- **Address card + picker** (buyer checkout, delivery info).
- **Stat tile row** — dashboard KPIs linking to filtered lists (ADM-019 AC1).

## 6. Tables, Forms, Filters, Dashboards

**Highest-volume tables:** admin orders, POs, inventory, payments, payables,
quotations; supplier requirements and POs; buyer orders and products. All need
server-side pagination/sort/filter from day one (design assumption: thousands
of rows).

**Complex forms:** supplier/buyer registration (multi-step with uploads),
requirement editor, quotation form (price, quantity, lead time, validity,
terms, attachments), product editor, checkout, goods receipt, refund entry.
Forms follow one layout system: labelled groups, inline validation, explicit
draft/submit semantics where workflows have Draft states.

**Filter standards:** by status (every lifecycle list), category, date range,
supplier/buyer, amount range; free-text search on reference numbers
(order/PO/requirement/request IDs are first-class citizens).

**Dashboards:** Admin — pending approvals, open requirements, quotes awaiting
review, orders by status, payment verifications pending, orders nearing
timeout, low stock, payables due. Supplier — open matched requirements, quotes
needing revision, POs awaiting acknowledgement/dispatch, outstanding
receivables. Buyer — order statuses, pending payments/confirmations, request
statuses. (Chart design will follow the dataviz guidance when dashboards are
designed.)

## 7. Responsive Requirements

- **Buyer portal: fully responsive**, mobile-first for browse/track flows —
  institutional users will browse and approve on phones; checkout and tables
  must degrade gracefully (tables → cards on small screens).
- **Supplier portal: responsive down to tablet; phone-usable** for the
  high-urgency flows (requirement notifications, quote status, PO
  acknowledgement, proof upload — camera capture of POD is a phone-native act).
- **Admin portal: desktop-first** (dense tables and comparison views),
  functional at tablet width; no phone optimization commitment in phase 1.
- Breakpoint system, type scale and spacing tokens to be defined in the design
  system (next phase) and used identically across portals.

## 8. Design Dependencies & Unresolved Questions

Blocking or shaping design, from the decisions register:

| # | Dependency | Affects |
|---|---|---|
| D1 | ✅ RESOLVED — OBD-03: public catalog with standard listed prices; discounted prices for approved, logged-in buyers only (pending accounts see standard prices). Public homepage and catalog design fully unblocked. | Landing page, public catalog, registration funnel |
| D2 | P-06 stock display to buyers (exact / banded / none) | B4/B5 availability UI |
| D3 | OBD-09 MOQ / minimum order value | Cart & checkout validation UI |
| D4 | OBD-15 multi-user organizations | Profile screens, approval flows, header account UI |
| D5 | OBD-16 admin internal roles | Admin navigation visibility model |
| D6 | OBD-02 verification workflows (◇ proposed, unapproved) | Registration steps, document slots, review checklists |
| D7 | GST rates/HSN + CGST/SGST-vs-IGST (OBD-20, tax professional) | Checkout and invoice GST-breakdown layout (structure can be designed; values/splits cannot be final) |
| D8 | OBD-21 gateway selection | Checkout payment-step flow details |
| D9 | Brand identity (logo, palette, typefaces) — `brand/` is empty | Everything visual; blocks high-fidelity design, not structure |
| D10 | OBD-07 non-winner messaging ("not selected" vs "closed") | S5 quotation status copy |
| D11 | Confirmation timeout defaults (OBD-19/21 ◇) | B10 prompt copy, admin timeout views |
| D12 | Public product enquiry — `PENDING business-requirements approval`, NOT an approved functional requirement. The public-page enquiry form is a PROTOTYPE CONCEPT only: no intake, lead storage, notifications or admin handling queue exist or are specified, and none may be built until the owner approves a requirement (new FR + ADM queue) through the business-requirements process. Related note: brand/maker display on public pages (an approved attribute, Workflow I) is withheld until real, authorized brand names exist. | Public product detail, homepage CTA band, future ADM lead queue |

**Recommended design order:** design tokens + shared components (§5) → buyer
portal (revenue-facing, simplest) → supplier portal → admin portal (largest,
most reusable patterns by then) — with D1, D2, D9 resolved before buyer-portal
high-fidelity work.
