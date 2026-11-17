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
  messages: { from: "prosmash" | "supplier" | "system"; meta: string; body: string }[];
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
  fulfilment: "acknowledged" | "awaiting-proof" | "delivered-proof" | "closed";
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
