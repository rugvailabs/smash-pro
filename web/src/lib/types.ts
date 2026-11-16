/** Account states available in the preview role switcher.
 *  Real authentication replaces this in a later phase. */
export type Role = "visitor" | "pending" | "buyer" | "supplier";

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
  /** Path under /img — interim CC-licensed imagery (see /img/LICENSES.md). */
  img: string;
  meta: string;
  /** Standard listed price, GST-inclusive (OBD-03/OBD-20). */
  std: number;
  /** Approved-buyer applicable price, GST-inclusive. Illustrative sample
   *  tier — configured discounts pending owner approval (OBD-20). */
  buyer: number;
  /** Requires the racquet configurator (stringing/tension/grip). */
  configurable?: boolean;
  specs: [string, string][];
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
