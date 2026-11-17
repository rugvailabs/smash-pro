/* ============================================================
   Super Admin Dashboard — shared contract types (B5).
   Owned by the orchestrator; backend (server/admin.ts +
   lib/admin-api.ts) implements against these, frontend
   (app/admin/**) consumes them. Money is two-decimal RUPEES at
   this boundary (paise stay server-side). Pending OBD items
   (GST rates/HSN, commission/settlement, cancellation windows,
   verification checklists) are deliberately ABSENT — do not add.
   ============================================================ */

export interface AdminCounts {
  pendingOrgs: number;
  paymentsToVerify: number;
  openComplaints: number;
  requirementsOpen: number;
  quotesAwaitingAction: number;
  posInFlight: number;
  productRequestsInReview: number;
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
  std: number; // rupees
  active: boolean;
  configurable: boolean;
  hasImg: boolean;
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
}

export interface AdminRequirementDetail extends AdminRequirementRow {
  spec: [string, string][] | null;
  requiredBy: string | null;
  quotes: AdminQuoteView[];
}

export interface AdminPoRow {
  id: string;
  supplierName: string;
  destination: "warehouse" | "direct";
  issued: string;
  lineName: string;
  lineQty: number;
  unit: number;
  value: number;
  fulfilment: "issued" | "acknowledged" | "awaiting-proof" | "delivered-proof" | "closed";
  fulfilmentLabel: string;
  received: number;
  outstanding: number;
  payStatusLabel: string;
  /** next legal fulfilment advance, or null */
  nextFulfilment: { fulfilment: string; label: string } | null;
}

export interface AdminComplaintRow {
  id: number;
  orderId: string;
  orgName: string;
  body: string;
  status: "open" | "resolved";
  created: string;
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
