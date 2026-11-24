import {
  boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp,
} from "drizzle-orm/pg-core";

/* ============================================================
   Smash Pro schema (ADR-0003). Conventions:
   - money = integer paise (`*_paise`); UI renders two-decimal ₹
   - GST: `hsn`/`gstPercent` are optional admin-entered record-keeping
     fields only (ADR-0014) — NOT wired into checkout/invoice/pricing
     GST calculations, which stay NULL/absent until OBD-11/OBD-20
     resolve with professional tax validation
   - business refs (ORD-/PO-/REQ-) are text primary keys
   - quotation versions are immutable rows (never updated)
   - every state transition appends to audit_log (PLT-003)
   ============================================================ */

/* ---------- identity (ADR-0004) ---------- */

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // 'buyer' | 'supplier'
  status: text("status").notNull().default("pending"), // pending | active | suspended | rejected
  name: text("name").notNull(),
  legalName: text("legal_name").notNull().default(""),
  orgType: text("org_type").notNull().default(""), // School / Manufacturer / …
  gstin: text("gstin").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  email: text("email").notNull().default(""),
  city: text("city").notNull().default(""),
  worksAddress: text("works_address").notNull().default(""),
  /** buyer: registration category (OBD-20 buyer-category ◇ — label only) */
  buyerCategory: text("buyer_category"),
  /** supplier: approved category slugs (requirement matching) */
  approvedCategories: jsonb("approved_categories").$type<string[]>(),
  /** supplier: direct-shipment approval — admin-set (OBD-19 Option C) */
  directApproved: boolean("direct_approved").notNull().default(false),
  /** supplier: per-product direct enablement [label, state] view data */
  directEnabled: jsonb("direct_enabled").$type<[string, string][]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  /** 'buyer' | 'supplier' | 'admin' — mirrors org kind for org users */
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- catalogue & pricing (OBD-03 / OBD-20 decided parts) ---------- */

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Brand master list (simple: name + optional notes). A product carries at
 *  most one brand, set once in the Add Product form — never re-typed per
 *  purchase; purchase-order rows resolve brand through their linked SKU. */
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  sku: text("sku").primaryKey(),
  name: text("name").notNull(),
  catSlug: text("cat_slug").notNull().references(() => categories.slug),
  sub: text("sub").notNull(),
  brandId: integer("brand_id").references(() => brands.id),
  img: text("img"), // null → labelled placeholder frame (no fake imagery)
  gallery: jsonb("gallery").$type<string[]>(),
  meta: text("meta").notNull().default(""),
  /** standard listed price, GST-inclusive (OBD-03) — this IS the visitor
   *  selling price; for products entered via the cost-based form below it
   *  is purchasePaise + marginPaise, resolved server-side at save time */
  stdPaise: integer("std_paise").notNull(),
  /** cut-off/MRP price shown struck through against the visitor selling
   *  price; null for products predating this pricing-entry mode */
  mrpPaise: integer("mrp_paise"),
  /** dealer/purchase (cost) price — admin-only, never serialised publicly */
  purchaseMode: text("purchase_mode"), // 'percent' (of MRP) | 'fixed'
  purchaseValue: doublePrecision("purchase_value"), // raw entered number
  purchasePaise: integer("purchase_paise"), // resolved ₹ paise
  /** ProSmash margin — admin-only, never serialised publicly */
  marginMode: text("margin_mode"), // 'percent' (of Dealer/Purchase price, OBD-23 amendment 2026-11-20) | 'fixed'
  marginValue: doublePrecision("margin_value"), // raw entered number
  marginPaise: integer("margin_paise"), // resolved ₹ paise
  configurable: boolean("configurable").notNull().default(false),
  specs: jsonb("specs").$type<[string, string][]>().notNull(),
  directShip: boolean("direct_ship").notNull().default(false),
  /** ADR-0014: optional, admin-entered record-keeping field — a free-text
   *  HSN/SAC code, not validated against any tax classification authority.
   *  Null for products predating this field / not yet classified. Not read
   *  by any checkout, invoice, or pricing calculation (OBD-11/OBD-20 still
   *  pending professional tax validation for that). */
  hsn: text("hsn"),
  /** ADR-0014: optional, admin-entered record-keeping field — a GST rate
   *  (0–100) the admin believes applies, not a system-computed or
   *  validated rate. Null for products predating this field / not yet
   *  classified. Not read by any checkout, invoice, or pricing
   *  calculation (OBD-11/OBD-20 still pending professional tax
   *  validation for that). */
  gstPercent: doublePrecision("gst_percent"),
  /** ADR-0015: optional, admin-entered record-keeping field — the
   *  original vendor/supplier item code (e.g. a LI-NING or HUNDRED stock
   *  sheet code), distinct from this app's own `sku` primary key. Used to
   *  trace an imported row back to its source line / re-match on future
   *  stock-sheet updates. Never read by pricing, checkout, or invoices. */
  supplierCode: text("supplier_code"),
  /** ADR-0015: optional, admin-entered record-keeping field — a third
   *  reference price point (seen in supplier stock sheets, between Dealer
   *  Price and MRP) ProSmash does not otherwise model. Entered directly
   *  in rupees, same as MRP; not wired into the Dealer→Margin→Visitor
   *  price calculation. */
  mspPaise: integer("msp_paise"),
  /** ADR-0015: optional, admin-entered descriptive attribute — free text.
   *  (ADR-0016 amendment: this CAN now be a structured variant dimension —
   *  see `groupKey` below. Rows ungrouped — `groupKey` null — still treat
   *  this as purely descriptive, exactly as ADR-0015 shipped it.) */
  color: text("color"),
  /** ADR-0015: optional, admin-entered descriptive attribute — free text
   *  (shoe size, apparel size, grip size, etc. all share this one field;
   *  format varies by category and is never validated/converted). */
  size: text("size"),
  /** ADR-0016: optional, admin/importer-assigned grouping key. Rows sharing
   *  a non-null groupKey are ONE buyer-facing listing (one catalogue card,
   *  one product page) with a Size/Colour picker across them — each row is
   *  still the real sellable unit (own price/stock/HSN/GST); picking an
   *  option just resolves which sku a buyer is actually ordering. Null
   *  (the default, and every pre-ADR-0016 row) = a standalone, ungrouped
   *  product — behaviour is completely unchanged from before this column
   *  existed. Free text, e.g. the base model code shared across a shoe's
   *  colourways/sizes; never validated against anything, admin/importer
   *  is solely responsible for which rows share one. */
  groupKey: text("group_key"),
  /** ADR-0015: current sellability, separate from `active` — `active`
   *  controls catalogue visibility, `inStock` flags temporary unavailability
   *  of a still-listed product. Defaults true (unknown = assumed available). */
  inStock: boolean("in_stock").notNull().default(true),
  /** ADR-0019: unit count on hand. A supplier stock sheet often lists the
   *  same product as several identical repeated rows (one per physical
   *  unit) rather than one row with a count — bulkImportProducts collapses
   *  exact duplicates (same name/sub/colour/size/prices/GST/group) into a
   *  single product row with `qty` set to how many repeats it found.
   *  Defaults 1 for a normal single-unit row / anything predating this field. */
  qty: integer("qty").notNull().default(1),
  active: boolean("active").notNull().default(true),
});

/** LEGACY (OBD-20 Option A) — product-category / per-org / per-product
 *  discount rules. Superseded by buyer-type discounts (OBD-05 revision):
 *  the pricing engine no longer reads this table. Retained (not dropped)
 *  pending an approved data migration of any live rows. */
export const priceRules = pgTable("price_rules", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  catSlug: text("cat_slug").references(() => categories.slug),
  sku: text("sku").references(() => products.sku),
  discountPct: integer("discount_pct_bp").notNull(), // basis points (1500 = 15%)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** OBD-05 (revised): buyer-CATEGORY discounts. One configurable rate per
 *  buyer organisation type, applied uniformly to EVERY product in ALL
 *  categories for every approved buyer of that type. `buyerType` is one of
 *  the four BuyerTypeKey values (lib/buyer-types.ts); `discountBp` is basis
 *  points off the public standard listed price, applied before GST; `active`
 *  toggles the rate without deleting it. At most one row per buyer type. */
export const buyerTypeDiscounts = pgTable("buyer_type_discounts", {
  id: serial("id").primaryKey(),
  buyerType: text("buyer_type").notNull(), // schools-colleges | sports-academies | retail-shops | other-institutions
  discountBp: integer("discount_bp").notNull(), // basis points (1500 = 15%)
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- buyer org data ---------- */

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  label: text("label").notNull(),
  detail: text("detail").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

/** metadata only — ADR-0005 (no file bytes in phase 1) */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  filename: text("filename").notNull(),
  state: text("state").notNull().default("submitted"), // OBD-02 ◇ — no review workflow
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- commerce (OBD-08 / OBD-21 decided path) ---------- */

export const cartLines = pgTable("cart_lines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  key: text("key").notNull(), // sku or sku|config-json
  sku: text("sku").notNull().references(() => products.sku),
  qty: integer("qty").notNull(),
  config: jsonb("config").$type<{ string: string; tension: string; grip: string } | null>(),
  deltaPaise: integer("delta_paise").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // ORD-YYYY-NNNNN
  orgId: integer("org_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  /** display date ("14 Nov 2026") — presentation strings mirror the UI */
  placed: text("placed").notNull(),
  /** order-progress rail steps (presentation) */
  rail: jsonb("rail").$type<{ label: string; date?: string; state: "done" | "cur" | "todo" }[]>().notNull(),
  /** placed | processing | dispatched | delivered | confirm-receipt | cancelled */
  status: text("status").notNull().default("placed"),
  statusLabel: text("status_label").notNull().default("Placed"),
  direct: boolean("direct").notNull().default(false),
  subtotalExGstPaise: integer("subtotal_ex_gst_paise").notNull(),
  gstPaise: integer("gst_paise").notNull(),
  shippingPaise: integer("shipping_paise"),
  totalPaise: integer("total_paise").notNull(),
  shipTo: text("ship_to").notNull(),
  /** 'managed' | 'self-pickup' | 'self-courier' (OBD-22, ADR-0009). DB
   *  default exists only to keep pre-existing seeded rows valid — the
   *  application always passes this explicitly, never relies on it. */
  deliveryMethod: text("delivery_method").notNull().default("managed"),
  /** Pickup-location snapshot, set only when deliveryMethod = 'self-pickup'
   *  (OBD-22) — a later address change never rewrites historical orders. */
  pickupNote: text("pickup_note"),
  dispatchedAt: text("dispatched_at"),
  transportRef: text("transport_ref"),
  deliveredOn: text("delivered_on"),
  deliveryProofOnRecord: boolean("delivery_proof_on_record").notNull().default(false),
  receiptConfirmed: boolean("receipt_confirmed").notNull().default(false),
});

export const orderLines = pgTable("order_lines", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(), // snapshot at order time
  unitPaise: integer("unit_paise").notNull(),
  qty: integer("qty").notNull(),
  config: jsonb("config").$type<{ string: string; tension: string; grip: string } | null>(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  method: text("method").notNull(), // UPI | Card | Net Banking | NEFT | RTGS | Cheque
  /** confirmed | awaiting-verification | failed | cancelled-unpaid */
  status: text("status").notNull(),
  statusLabel: text("status_label").notNull(),
  reference: text("reference"),
  declaredAmountPaise: integer("declared_amount_paise"),
  proofFilename: text("proof_filename"), // metadata only (ADR-0005)
  proofUploadedAt: text("proof_uploaded_at"),
  confirmedAt: text("confirmed_at"),
  verifiedByUserId: integer("verified_by_user_id").references(() => users.id),
});

/* ---------- procurement (Workflows C–G, N) ---------- */

export const requirements = pgTable("requirements", {
  id: text("id").primaryKey(), // REQ-YYYY-NNNN
  title: text("title").notNull(),
  catSlug: text("cat_slug").notNull().references(() => categories.slug),
  qty: text("qty").notNull(),
  destination: text("destination").notNull(), // 'warehouse' | 'direct'
  published: text("published"),
  closes: text("closes").notNull(),
  closesToday: boolean("closes_today").notNull().default(false),
  /** open | quoted-revision | awarded | closed (supplier-view status) */
  status: text("status").notNull().default("open"),
  statusLabel: text("status_label").notNull(),
  spec: jsonb("spec").$type<[string, string][]>(),
  requiredBy: text("required_by"),
  attachments: jsonb("attachments").$type<{ file: string; meta: string }[]>(),
  poId: text("po_id"),
  /** ADR-0018: multi-product requirements — one admin publish, several line items.
   *  `title`/`catSlug`/`qty` above stay a derived summary (first item's
   *  title when one item, "N products"/"mixed" when several) so every
   *  existing list/filter keeps working unchanged; this is the source of
   *  truth once present. Null for requirements predating this field
   *  (single-item, as `title`/`catSlug`/`qty` already describe it). */
  items: jsonb("items").$type<{ title: string; catSlug: string; qty: string }[]>(),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  reqId: text("req_id").notNull().references(() => requirements.id),
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  /** submitted | revision-requested | awarded | withdrawn | closed */
  status: text("status").notNull().default("submitted"),
  statusLabel: text("status_label").notNull().default("Submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** immutable — a revision inserts a new row, never updates */
export const quotationVersions = pgTable("quotation_versions", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  v: integer("v").notNull(),
  unitPaise: integer("unit_paise").notNull(),
  quantity: text("quantity").notNull(),
  lead: text("lead").notNull(),
  validTill: text("valid_till").notNull(),
  terms: text("terms").notNull(),
  summary: text("summary").notNull().default(""),
  date: text("date").notNull().default(""),
  attachments: integer("attachments").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** ADR-0018: itemized pricing for a multi-product requirement — one unit price per
   *  line item, matching `requirements.items`. Null for a single-product
   *  quotation, where `unitPaise`/`quantity` above remain authoritative.
   *  When present, `unitPaise` is unused (0) and `quantity` is a display
   *  summary ("N products") — `totalPaise` is the comparable grand total. */
  items: jsonb("items").$type<{ title: string; catSlug: string; qty: string; unitPaise: number }[]>(),
  totalPaise: integer("total_paise").notNull().default(0),
});

export const negotiationMessages = pgTable("negotiation_messages", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  fromRole: text("from_role").notNull(), // 'smash pro' | 'you' | 'system'
  meta: text("meta").notNull().default(""),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(), // PO-YYYY-NNNNN
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  quotationId: integer("quotation_id").references(() => quotations.id),
  /** ADR-0018: denormalized from the quotation for direct lookup — "every PO line
   *  issued from this requirement's award" (a multi-product award issues
   *  one PO row per line item, all sharing a quotationId and reqId). */
  reqId: text("req_id").references(() => requirements.id),
  destination: text("destination").notNull(), // 'warehouse' | 'direct' (OBD-19 Option C)
  issued: text("issued").notNull(),
  lineName: text("line_name").notNull(),
  /** optional catalogue product this line represents — lets Brand (and any
   *  future product-linked data) resolve automatically; not all POs map to
   *  a catalogue SKU (requirements are category/free-text, not SKU-based) */
  sku: text("sku").references(() => products.sku),
  lineQty: integer("line_qty").notNull(),
  unitPaise: integer("unit_paise").notNull(),
  valuePaise: integer("value_paise").notNull(),
  /** acknowledged | awaiting-proof | delivered-proof | closed */
  fulfilment: text("fulfilment").notNull(),
  fulfilmentLabel: text("fulfilment_label").notNull(),
  dispatchBy: text("dispatch_by"),
  acknowledgedAt: text("acknowledged_at"),
  dispatchedQty: text("dispatched_qty"),
  receivedQty: text("received_qty"),
  awardedFrom: jsonb("awarded_from").$type<{ reqId: string; version: string }>(),
  terms: jsonb("terms").$type<{ unit: number; qty: number; lead: string; validTill: string; payment: string }>(),
  paymentTerms: text("payment_terms").notNull().default(""),
  receivedPaise: integer("received_paise").notNull().default(0),
  outstandingPaise: integer("outstanding_paise").notNull().default(0),
  payStatusLabel: text("pay_status_label").notNull().default(""),
  minDeliveryInfo: jsonb("min_delivery_info").$type<[string, string][]>(),
  shipment: jsonb("shipment").$type<{ dispatched: string; lr: string; qtyShipped: string }>(),
});

/** ADR-0018: a supplier's tax invoice for goods received against one or
 *  more POs from the same award — recorded by admin in the structure of a
 *  standard GST
 *  tax invoice (seller/buyer blocks, HSN-coded line items, CGST/SGST/IGST
 *  split, HSN-wise tax summary, amount in words). This is a RECORD-KEEPING
 *  transcription of a document the supplier already issued — every GST/HSN
 *  figure here is admin-entered (optionally pre-filled from the linked
 *  product's own ADR-0014 hsn/gstPercent) and the CGST+SGST vs IGST split
 *  is a structural same-state/different-state check, never a computed or
 *  asserted tax position. Still pending OBD-11/OBD-20 professional tax
 *  validation, same as every other GST-adjacent field in this app. */
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(), // INV-YYYY-NNNNN (internal reference only)
  reqId: text("req_id").notNull().references(() => requirements.id),
  quotationId: integer("quotation_id").references(() => quotations.id),
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  poIds: jsonb("po_ids").$type<string[]>().notNull(),
  /** draft | sent */
  status: text("status").notNull().default("draft"),
  /** as printed on the supplier's own invoice — SMASH PRO does not assign this */
  supplierInvoiceNo: text("supplier_invoice_no").notNull().default(""),
  supplierInvoiceDate: text("supplier_invoice_date").notNull().default(""),
  placeOfSupply: text("place_of_supply").notNull().default(""),
  transportMode: text("transport_mode").notNull().default(""),
  paymentTerms: text("payment_terms").notNull().default(""),
  /** 'intra' = CGST+SGST, 'inter' = IGST */
  taxMode: text("tax_mode").notNull().default("intra"),
  lines: jsonb("lines").$type<{
    poId: string; description: string; hsn: string; qty: number; uom: string;
    ratePaise: number; discPaise: number; taxableValuePaise: number;
    gstPercent: number; cgstPaise: number; sgstPaise: number; igstPaise: number;
  }[]>().notNull(),
  taxableTotalPaise: integer("taxable_total_paise").notNull().default(0),
  cgstTotalPaise: integer("cgst_total_paise").notNull().default(0),
  sgstTotalPaise: integer("sgst_total_paise").notNull().default(0),
  igstTotalPaise: integer("igst_total_paise").notNull().default(0),
  roundOffPaise: integer("round_off_paise").notNull().default(0),
  grandTotalPaise: integer("grand_total_paise").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
  sentAt: text("sent_at"),
});

export const deliveryProofs = pgTable("delivery_proofs", {
  id: serial("id").primaryKey(),
  poId: text("po_id").notNull().references(() => purchaseOrders.id),
  filename: text("filename").notNull(), // metadata only (ADR-0005)
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  recipientConfirmedAt: timestamp("recipient_confirmed_at", { withTimezone: true }),
});

export const supplyItems = pgTable("supply_items", {
  id: serial("id").primaryKey(),
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  capacity: text("capacity").notNull(),
  lead: text("lead").notNull(),
  costPaise: integer("cost_paise").notNull(),
  proposal: text("proposal"),
  /** supplier-managed availability (PHASE 2 — product availability mgmt) */
  available: boolean("available").notNull().default(true),
});

export const costProposals = pgTable("cost_proposals", {
  id: serial("id").primaryKey(),
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  statusLabel: text("status_label").notNull(),
  accepted: boolean("accepted"),
});

export const supplierPaymentRecords = pgTable("supplier_payment_records", {
  id: serial("id").primaryKey(),
  supplierOrgId: integer("supplier_org_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  meta: text("meta").notNull(),
});

/* ---------- buyer requests & complaints ---------- */

export const productRequests = pgTable("product_requests", {
  id: text("id").primaryKey(), // REQ-YYYY-NNNN (buyer namespace)
  orgId: integer("org_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  qty: integer("qty").notNull(),
  neededBy: text("needed_by"),
  submitted: text("submitted").notNull(),
  /** in-review | available | declined */
  status: text("status").notNull().default("in-review"),
  statusLabel: text("status_label").notNull().default("In sourcing review"),
  declineReason: text("decline_reason"),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  body: text("body").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** ADR-0020: equipment Care/Repair service booking — public, no account
 *  required (contact details captured directly on the form, same as a
 *  support/contact enquiry). orgId/userId are filled in opportunistically
 *  when the submitter happens to be signed in, but are never required.
 *  Pricing is explicitly NOT decided here: `quotedPaise` stays null until
 *  an admin inspects the photos/description and enters one manually —
 *  no payment flow is wired to it (PENDING CONFIRMATION, same as the
 *  rest of this feature's business rules beyond what's built). */
export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey(), // SR-YYYY-NNNNN
  orgId: integer("org_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  kind: text("kind").notNull(), // 'care' | 'repair'
  sport: text("sport").notNull(), // 'cricket' | 'badminton'
  services: jsonb("services").$type<string[]>().notNull(),
  equipmentSource: text("equipment_source").notNull(), // 'new' | 'own'
  brand: text("brand"),
  model: text("model"),
  description: text("description"),
  /** at least one required — enforced at submission, not here */
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  voiceNoteUrl: text("voice_note_url"),
  /** new | quoted | approved | in-progress | completed | declined | cancelled */
  status: text("status").notNull().default("new"),
  statusLabel: text("status_label").notNull().default("New"),
  quotedPaise: integer("quoted_paise"),
  adminNote: text("admin_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

/** ADR-0021: admin-editable public-site content — homepage hero carousel
 *  slides, and each catalogue category's banner image + intro paragraph.
 *  One flexible table (discriminated by `section`) rather than three,
 *  since all three are "a small ordered list of mostly-text rows an
 *  admin edits occasionally" — not worth three separate schemas/admin
 *  screens. Seeded from the previously-hardcoded content so nothing
 *  changes visually until an admin edits something. */
export const siteContent = pgTable("site_content", {
  id: text("id").primaryKey(),
  section: text("section").notNull(), // 'hero-slide' | 'category-hero' | 'category-intro'
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  /** category-hero / category-intro only */
  catSlug: text("cat_slug").references(() => categories.slug),
  /** hero-slide / category-hero: an approved /img/... path or upload URL */
  img: text("img"),
  imgPosition: text("img_position"), // hero-slide only — CSS object-position
  eyebrow: text("eyebrow"), // hero-slide only
  titleA: text("title_a"), // hero-slide only
  accent: text("accent"), // hero-slide only
  titleB: text("title_b"), // hero-slide only
  /** hero-slide: the paragraph under the title. category-intro: the
   *  category's one-line description. */
  body: text("body"),
  ctaLabel: text("cta_label"), // hero-slide only
  ctaHref: text("cta_href"), // hero-slide only
  /** hero-slide only — CTA swaps to "browse" copy for already-approved roles */
  institutional: boolean("institutional").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- platform (PLT-002 / PLT-003) ---------- */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** append-only — "nothing moves without a record" */
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  detail: jsonb("detail"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
