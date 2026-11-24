import type { PriceMode } from "@/lib/pricing-calc";
import type { QuoteItem, RequirementItem } from "@/lib/types";

/* ============================================================
   Super Admin Dashboard — shared contract types (B5).
   Owned by the orchestrator; backend (server/admin.ts +
   lib/admin-api.ts) implements against these, frontend
   (app/admin/**) consumes them. Money is two-decimal RUPEES at
   this boundary (paise stay server-side). Pending OBD items
   (commission/settlement, cancellation windows, verification
   checklists) are deliberately ABSENT — do not add. Product
   `hsn`/`gstPercent` (ADR-0014) and `supplierCode`/`msp`/
   `color`/`size`/`inStock` (ADR-0015, supplier stock-sheet import)
   ARE present as optional, admin-entered record-keeping fields —
   none of them feed any GST/pricing computation, which stays
   pending OBD-11/OBD-20.
   ============================================================ */

export interface AdminCounts {
  pendingOrgs: number;
  paymentsToVerify: number;
  openComplaints: number;
  requirementsOpen: number;
  quotesAwaitingAction: number;
  posInFlight: number;
  productRequestsInReview: number;
  serviceRequestsNew: number;
}

export interface AdminOrgRow {
  id: number;
  kind: "buyer" | "supplier";
  status: "pending" | "active" | "suspended" | "rejected";
  name: string;
  legalName: string;
  orgType: string;
  gstin: string;
  city: string;
  contactName: string;
  contactPhone: string;
  email: string;
  /** supplier only — self-declared at registration, admin-reviewed at approval */
  requestedCategories: string[] | null;
  directApproved: boolean;
  submitted: string; // display date
  documents: { filename: string; state: string }[];
}

export interface AdminProductRow {
  sku: string;
  name: string;
  catSlug: string;
  sub: string;
  meta: string;
  std: number; // rupees
  active: boolean;
  configurable: boolean;
  hasImg: boolean;
  /** the actual path/URL, or null — lets the row's "Edit image" control
   *  show the current image as its starting value */
  img: string | null;
  /** up to 3 additional images (4 total with `img`); empty when none set */
  gallery: string[];
  brand: string | null;
  /** the brand's id, for pre-selecting it in an edit form; null when unbranded */
  brandId: number | null;
  /** ADR-0014 — optional, admin-entered record-keeping field; null until set */
  hsn: string | null;
  /** ADR-0014 — optional, admin-entered record-keeping field; null until set */
  gstPercent: number | null;
  /** ADR-0015 — original vendor/supplier item code; null until set */
  supplierCode: string | null;
  /** ADR-0015 — optional third reference price point, rupees; null until set */
  msp: number | null;
  /** ADR-0015 — optional free-text colour; null until set */
  color: string | null;
  /** ADR-0015 — optional free-text size; null until set */
  size: string | null;
  /** ADR-0015 — current sellability, separate from `active`; defaults true */
  inStock: boolean;
  /** ADR-0019 — unit count on hand; collapsed from repeated identical import
   *  rows. Defaults 1. */
  qty: number;
  /** ADR-0016 — buyer-facing variant grouping key; rows sharing one are
   *  ONE catalogue card/product page with a Size/Colour picker; null until
   *  set (standalone, ungrouped product — the default). */
  groupKey: string | null;
  /** ADR-0011 cost breakdown — MRP is shown for context; Dealer/Purchase
   *  price stays creation-only (read-only here). Margin mode/value ARE
   *  editable (ADR-0017 amendment) so a batch-imported placeholder margin
   *  can be corrected per product; null for products predating the
   *  cost-based entry form. */
  mrp: number | null;
  /** resolved Dealer/Purchase price, rupees — the margin base */
  purchase: number | null;
  purchaseMode: PriceMode | null;
  purchaseValue: number | null;
  marginMode: PriceMode | null;
  marginValue: number | null;
}

export interface AdminBrandRow {
  id: number;
  name: string;
  notes: string | null;
  /** products currently assigned to this brand */
  productCount: number;
}

/** LEGACY — product-category / per-org / per-product rules (superseded by
 *  BuyerTypeDiscountRow). Retained only while the legacy routes exist. */
export interface AdminPriceRule {
  id: number;
  scope: "category-default" | "org-category" | "org-product";
  orgId: number | null;
  orgName: string | null;
  catSlug: string | null;
  sku: string | null;
  /** basis points — 1500 = 15% */
  discountBp: number;
}

/** OBD-05 (revised) buyer-category discount row — one per buyer org type.
 *  Always returns the full set of four types (configured or not). */
export interface BuyerTypeDiscountRow {
  buyerType: string;
  label: string;
  /** always "All Products" — the rate applies across every category */
  coverage: string;
  /** whether a rate has been set for this type */
  configured: boolean;
  /** rate as a percentage (e.g. 12.5), 0 when not configured */
  discountPct: number;
  active: boolean;
}

export interface AdminOrderRow {
  id: string;
  orgName: string;
  placed: string;
  status: string;
  statusLabel: string;
  direct: boolean;
  total: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  lineCount: number;
}

export interface AdminOrderDetail extends AdminOrderRow {
  shipTo: string;
  /** OBD-22 — data plumbing only; no admin UI change in this pass. */
  deliveryMethod: "managed" | "self-pickup" | "self-courier";
  pickupNote: string | null;
  rail: { label: string; date?: string; state: "done" | "cur" | "todo" }[];
  lines: { sku: string; name: string; qty: number; unit: number; total: number }[];
  subtotalExGst: number;
  gst: number;
  shipping: number;
  payment: {
    method: string;
    reference: string | null;
    declaredAmount: number | null;
    proofFilename: string | null;
    proofUploadedAt: string | null;
  };
  /** next legal rail advance, or null when admin cannot advance it */
  nextStatus: { status: string; label: string } | null;
  complaints: { id: number; body: string; status: string; created: string }[];
}

export interface AdminPaymentRow {
  orderId: string;
  orgName: string;
  method: string;
  status: string;
  statusLabel: string;
  total: number;
  declaredAmount: number | null;
  proofFilename: string | null;
  proofUploadedAt: string | null;
}

export interface AdminQuoteVersion {
  v: number;
  unit: number;
  quantity: string;
  lead: string;
  validTill: string;
  terms: string;
  date: string;
  current: boolean;
  /** present for a multi-product requirement's quotation — one unit price
   *  per line item; `unit`/`quantity` above are a legacy single-line view. */
  items?: QuoteItem[];
  total?: number;
}

export interface AdminQuoteView {
  quotationId: number;
  supplierOrgId: number;
  supplierName: string;
  status: string;
  statusLabel: string;
  versions: AdminQuoteVersion[];
  messages: { from: "smash pro" | "supplier" | "system"; meta: string; body: string }[];
}

export interface AdminRequirementRow {
  id: string;
  title: string;
  catSlug: string;
  qty: string;
  destination: "warehouse" | "direct";
  published: string | null;
  closes: string;
  status: string;
  statusLabel: string;
  quoteCount: number;
  poId: string | null;
  /** present (length > 1) for a multi-product requirement; `title`/
   *  `catSlug`/`qty` above stay a derived summary across all items. */
  items: RequirementItem[] | null;
}

export interface AdminRequirementDetail extends AdminRequirementRow {
  spec: [string, string][] | null;
  requiredBy: string | null;
  quotes: AdminQuoteView[];
}

export interface AdminPoRow {
  id: string;
  supplierOrgId: number;
  supplierName: string;
  /** the requirement this PO's award traces back to, when known — lets
   *  sibling PO lines from the same multi-product award group together
   *  (e.g. for invoicing). */
  reqId: string | null;
  destination: "warehouse" | "direct";
  issued: string;
  lineName: string;
  /** catalogue SKU this line represents, if the admin linked one at issue time */
  sku: string | null;
  /** resolved via sku → product → brand; null when no SKU is linked or the
   *  linked product has no brand assigned */
  brand: string | null;
  lineQty: number;
  /** price per unit, rupees — resolves to reference's "PRICE/UNIT" */
  unit: number;
  /** linked product's MRP (OBD-23), rupees — null when no SKU is linked or
   *  the linked product predates cost-based pricing entry */
  mrp: number | null;
  /** how far this PO's unit price sits below the linked product's MRP —
   *  NOT a supplier-negotiated discount (no such field exists anywhere in
   *  the quotation/PO model); null whenever `mrp` is null */
  discountVsMrpPct: number | null;
  value: number;
  fulfilment: "issued" | "acknowledged" | "awaiting-proof" | "delivered-proof" | "closed";
  fulfilmentLabel: string;
  received: number;
  outstanding: number;
  payStatusLabel: string;
  /** next legal fulfilment advance, or null */
  nextFulfilment: { fulfilment: string; label: string } | null;
  /** the invoice already recorded against this PO's requirement, if any */
  invoiceId: string | null;
}

/* ---------- supplier invoices (recorded against a PO award) ---------- */

export interface AdminInvoiceLine {
  poId: string;
  description: string;
  hsn: string;
  qty: number;
  uom: string;
  rate: number; // rupees
  disc: number; // rupees
  taxableValue: number; // rupees
  gstPercent: number;
  cgst: number; // rupees
  sgst: number; // rupees
  igst: number; // rupees
}

export interface AdminInvoiceRow {
  id: string;
  reqId: string;
  reqTitle: string;
  supplierOrgId: number;
  supplierName: string;
  poIds: string[];
  status: "draft" | "sent";
  supplierInvoiceNo: string;
  supplierInvoiceDate: string;
  grandTotal: number; // rupees
  createdAt: string;
  sentAt: string | null;
}

export interface AdminInvoiceDetail extends AdminInvoiceRow {
  placeOfSupply: string;
  transportMode: string;
  paymentTerms: string;
  taxMode: "intra" | "inter";
  lines: AdminInvoiceLine[];
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  /** seller (supplier) letterhead details, as recorded on their organization */
  seller: { legalName: string; address: string; gstin: string; phone: string; email: string };
  /** buyer (Smash Pro) letterhead details — the platform's own registration */
  buyer: { legalName: string; address: string; gstin: string; pan: string };
}

/** A PO line still awaiting an invoice (or already on one), scoped to one requirement award. */
export interface AdminInvoiceablePo {
  id: string;
  lineName: string;
  sku: string | null;
  lineQty: number;
  unit: number; // rupees
  value: number; // rupees
}

export interface AdminComplaintRow {
  id: number;
  orderId: string;
  orgName: string;
  body: string;
  status: "open" | "resolved";
  created: string;
}

export interface AdminHeroSlideRow {
  id: string;
  sortOrder: number;
  active: boolean;
  img: string;
  imgPosition: string;
  eyebrow: string;
  titleA: string;
  accent: string;
  titleB: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  institutional: boolean;
}

export interface AdminCategoryHeroRow {
  slug: string;
  label: string;
  img: string;
}

export interface AdminCategoryIntroRow {
  slug: string;
  label: string;
  body: string;
}

export interface AdminSiteContent {
  heroSlides: AdminHeroSlideRow[];
  categoryHero: AdminCategoryHeroRow[];
  categoryIntro: AdminCategoryIntroRow[];
}

export interface AdminServiceRequestRow {
  id: string;
  orgName: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  kind: "care" | "repair";
  sport: "cricket" | "badminton";
  services: string[];
  equipmentSource: "new" | "own";
  brand: string | null;
  model: string | null;
  description: string | null;
  photos: string[];
  voiceNoteUrl: string | null;
  status: "new" | "quoted" | "approved" | "in-progress" | "completed" | "declined" | "cancelled";
  statusLabel: string;
  quoted: number | null; // rupees
  adminNote: string | null;
  submitted: string;
}

export interface AdminProductRequestRow {
  id: string;
  orgName: string;
  title: string;
  category: string;
  qty: number;
  neededBy: string | null;
  submitted: string;
  status: "in-review" | "available" | "declined";
  statusLabel: string;
  declineReason: string | null;
}

export interface AdminReport {
  orders: { count: number; valueTotal: number; byStatus: [string, number][] };
  payments: { confirmedTotal: number; awaitingTotal: number; awaitingCount: number };
  procurement: { poValueTotal: number; outstandingToSuppliers: number; posOpen: number };
  orgs: { buyersActive: number; suppliersActive: number; pending: number };
  topCategories: { slug: string; name: string; value: number }[];
}

/* ============================================================
   Enhancements (B5+): audit viewer, organization management,
   bulk catalogue/pricing ops, supplier performance, payment
   reconciliation, extended analytics and CSV exports. All
   read-model types stay two-decimal RUPEES at this boundary.
   Pending OBD items remain ABSENT (no invoices/commission/
   settlement/gateway/GST-rate figures — amounts only).
   ============================================================ */

/* ---------- audit log viewer (read-only, append-only source) ---------- */

export interface AuditLogRow {
  id: number;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string;
  /** compact, human-readable summary of the detail jsonb (or null) */
  detail: string | null;
  at: string; // display timestamp
}

export interface AuditLogPage {
  rows: AuditLogRow[];
  /** total rows matching the active filter (drives "load more") */
  total: number;
  limit: number;
  offset: number;
  /** distinct entity types present, for the filter control */
  entities: string[];
}

/* ---------- organization management (active/suspended lifecycle) ---------- */

export interface AdminOrgFullRow {
  id: number;
  kind: "buyer" | "supplier";
  status: "pending" | "active" | "suspended" | "rejected";
  name: string;
  orgType: string;
  city: string;
  gstin: string;
  contactName: string;
  email: string;
  directApproved: boolean;
  submitted: string;
  /** buyers: orders placed */
  orderCount: number;
  /** suppliers: POs issued */
  poCount: number;
  /** buyers: total order value · suppliers: total PO value (incl. GST, rupees) */
  totalValue: number;
}

/* ---------- supplier performance (read-only analytics) ---------- */

export interface SupplierPerformanceRow {
  orgId: number;
  name: string;
  quotesSubmitted: number;
  quotesAwarded: number;
  /** 0..100, whole percent of submitted quotations awarded */
  winRate: number;
  posIssued: number;
  posClosed: number;
  posInFlight: number;
  /** direct POs with a delivery proof on record (or closed) */
  proofsOnRecord: number;
  /** direct POs still awaiting a delivery proof */
  awaitingProof: number;
  poValueTotal: number;
  outstanding: number;
}

/* ---------- payment reconciliation ---------- */

export interface ReconciliationRow {
  orderId: string;
  orgName: string;
  method: string;
  status: string;
  statusLabel: string;
  orderTotal: number;
  declaredAmount: number | null;
  /** declared amount differs from the order total */
  mismatch: boolean;
  confirmedAt: string | null;
  verifiedBy: string | null;
}

export interface Reconciliation {
  rows: ReconciliationRow[];
  summary: {
    confirmedCount: number;
    confirmedTotal: number;
    awaitingCount: number;
    awaitingTotal: number;
    failedCount: number;
    failedTotal: number;
    mismatchCount: number;
  };
}

/* ---------- business analytics (extended report aggregation) ---------- */

export interface AdminAnalytics {
  orders: {
    count: number;
    gmv: number;
    byStatus: { label: string; count: number; value: number }[];
  };
  /** order volume & value grouped by placed-month (chronological) */
  monthlyTrend: { month: string; count: number; value: number }[];
  topCategories: { slug: string; name: string; value: number }[];
  topBuyers: { orgId: number; name: string; orders: number; value: number }[];
  topSuppliers: { orgId: number; name: string; pos: number; value: number }[];
  /** PO fulfilment by current stage (counts sum to total POs) */
  fulfilmentFunnel: { label: string; count: number }[];
}
