/** Session roles — mirrors users.role plus the signed-out visitor state. */
export type Role = "visitor" | "pending" | "buyer" | "supplier" | "admin";

export interface Category {
  slug: string;
  name: string;
  /** Illustrative product count (preview data). */
  count: number;
}

export interface Product {
  sku: string;
  name: string;
  cat: string;
  sub: string;
  /** Path under /img — real CC-licensed imagery only (see /img/LICENSES.md).
   *  Optional: SKUs without approved imagery render the labelled placeholder
   *  frame (component library §4 rule) — never substitute stock photography. */
  img?: string;
  /** Optional additional gallery frames (Set A photography populates this;
   *  the PDP thumbnail rail renders only when more than one frame exists). */
  gallery?: string[];
  meta: string;
  /** Standard listed price, GST-inclusive (OBD-03/OBD-20) — this is the
   *  visitor selling price, shown to every visitor, pending account and buyer. */
  std: number;
  /** MRP / cut-off price, GST-inclusive — a public marketing figure (OBD-23),
   *  present only for products entered via the cost-based Add Product form.
   *  Never a cost or margin figure; shown to every visitor, same as `std`. */
  mrp?: number;
  /** Approved-buyer applicable price, GST-inclusive. Present ONLY when the
   *  backend priced the product for an approved buyer session — price
   *  isolation at the API boundary (OBD-03). Illustrative tier values
   *  pending owner approval (OBD-20). */
  buyer?: number;
  /** Requires the racquet configurator (stringing/tension/grip). */
  configurable?: boolean;
  specs: [string, string][];
  /** ADR-0015/0016 — free-text descriptive attributes; present when set. */
  color?: string;
  size?: string;
  /** ADR-0015/0016 — current sellability, separate from the product being
   *  listed at all; a buyer-facing Size/Colour option can be out of stock
   *  while the product itself stays listed. */
  inStock?: boolean;
  /** ADR-0016 — buyer-facing variant grouping key; present only when this
   *  SKU is grouped with sibling colour/size variants. */
  groupKey?: string;
  /** ADR-0016 — set only on a listing/search/related-products card that
   *  represents a group: how many active variants it stands in for. */
  variantCount?: number;
  /** ADR-0016 — set only on the product detail page's result, when this
   *  SKU belongs to a group: every active sibling variant (incl. this
   *  SKU), for the Size/Colour picker. */
  variants?: Product[];
}

export interface RacquetConfig {
  string: string;
  tension: string;
  grip: string;
}

export interface CartLine {
  key: string;
  sku: string;
  qty: number;
  config: RacquetConfig | null;
  /** Option price delta (illustrative, pending approval). */
  delta: number;
}

/* ---------- Phase C: buyer commerce (sample data shapes) ---------- */

export type PaymentMethod = "UPI" | "Card" | "Net Banking" | "NEFT" | "RTGS" | "Cheque";
export type PaymentStatus = "confirmed" | "awaiting-verification" | "failed" | "cancelled-unpaid";
export type OrderStatus = "placed" | "processing" | "dispatched" | "delivered" | "confirm-receipt" | "cancelled";
/** Warehouse-fulfilled delivery method (OBD-22). Never charged to the buyer:
 *  self-pickup/self-courier are the buyer's own arrangement; "managed" is
 *  free and offered only at/above the OBD-22 order-value threshold. */
export type DeliveryMethod = "managed" | "self-pickup" | "self-courier";

export interface OrderLine {
  sku: string;
  name: string;
  /** Unit price, GST-inclusive (buyer applicable price at order time). */
  unit: number;
  qty: number;
}

export interface RailStep {
  label: string;
  date?: string;
  state: "done" | "cur" | "todo";
}

export interface Order {
  id: string;
  placed: string;
  status: OrderStatus;
  statusLabel: string;
  direct: boolean;
  lines: OrderLine[];
  /** Illustrative GST presentation (rates per HSN pending — amounts unlabelled). */
  subtotalExGst: number;
  gst: number;
  /** null = not applicable (e.g. cancelled before dispatch). */
  shipping: number | null;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    statusLabel: string;
    reference?: string;
    confirmedAt?: string;
    proofFile?: string;
    proofUploadedAt?: string;
    declaredAmount?: number;
  };
  shipTo: string;
  /** OBD-22 — how a warehouse-fulfilled order reaches the buyer. Not
   *  applicable to pure direct-shipment orders, which keep OBD-19's own
   *  supplier→buyer flow regardless of this field's value. */
  deliveryMethod: DeliveryMethod;
  /** Pickup-location snapshot — present only when deliveryMethod is
   *  "self-pickup" (OBD-22). */
  pickupNote?: string;
  dispatched?: string;
  transportRef?: string;
  deliveredOn?: string;
  /** Direct shipments only — proof-first confirmation (OBD-19 Option A/C). */
  deliveryProofOnRecord?: boolean;
  receiptConfirmed?: boolean;
  rail: RailStep[];
}

export type RequestStatus = "in-review" | "available" | "declined";

export interface BuyerRequest {
  id: string;
  title: string;
  category: string;
  qty: number;
  neededBy?: string;
  submitted: string;
  status: RequestStatus;
  statusLabel: string;
}

export interface Address {
  label: string;
  detail: string;
  isDefault?: boolean;
}

export interface Institution {
  name: string;
  city: string;
  legalName: string;
  orgType: string;
  gstin: string;
  contact: string;
  email: string;
  buyerCategory: string;
  addresses: Address[];
  documents: { file: string; state: string }[];
}

/* ---------- Phase D: supplier workspace (sample data shapes) ---------- */

export type ReqStatus = "open" | "quoted-revision" | "awarded" | "closed";

export interface SupplierRequirement {
  id: string;
  title: string;
  category: string;
  qty: string;
  destination: string;
  published?: string;
  closes: string;
  closesToday?: boolean;
  status: ReqStatus;
  statusLabel: string;
  /** Spec key-values (requirement detail). */
  spec?: [string, string][];
  requiredBy?: string;
  attachments?: { file: string; meta: string }[];
  /** Linked PO when awarded. */
  poId?: string;
}

export interface QuoteVersion {
  v: string;
  unit: number;
  summary: string;
  date: string;
  current?: boolean;
}

export interface NegotiationMsg {
  from: "smash pro" | "you" | "system";
  meta: string;
  text: string;
}

export interface SupplierQuote {
  reqId: string;
  title: string;
  category: string;
  qty: string;
  closes: string;
  statusLabel: string;
  unit: number;
  quantity: string;
  lead: string;
  validTill: string;
  terms: string;
  attachments: number;
  versions: QuoteVersion[];
  thread: NegotiationMsg[];
}

export type PoFulfilment = "issued" | "acknowledged" | "awaiting-proof" | "delivered-proof" | "closed";

export interface SupplierPO {
  id: string;
  destination: "warehouse" | "direct";
  issued: string;
  lineName: string;
  lineQty: number;
  unit: number;
  value: number;
  fulfilment: PoFulfilment;
  fulfilmentLabel: string;
  dispatchBy?: string;
  acknowledgedAt?: string;
  dispatchedQty?: string;
  receivedQty?: string;
  awardedFrom?: { reqId: string; version: string };
  terms?: { unit: number; qty: number; lead: string; validTill: string; payment: string };
  paymentTerms: string;
  received: number;
  outstanding: number;
  payStatusLabel: string;
  /** Direct POs only — Minimum Delivery Information (OBD-19, the full set). */
  minDeliveryInfo?: [string, string][];
  shipment?: { dispatched: string; lr: string; qtyShipped: string };
}

export interface SupplyItem {
  name: string;
  category: string;
  capacity: string;
  lead: string;
  cost: number;
  proposal?: string;
}

export interface CostProposal {
  title: string;
  detail: string;
  statusLabel: string;
  accepted?: boolean;
}

export interface SupplierProfile {
  name: string;
  legalName: string;
  type: string;
  gstin: string;
  contact: string;
  email: string;
  worksAddress: string;
  categories: string[];
  documents: { file: string; state: string }[];
  directApproved: boolean;
  directEnabled: [string, string][];
}
