import {
  boolean, integer, jsonb, pgTable, serial, text, timestamp,
} from "drizzle-orm/pg-core";

/* ============================================================
   Smash Pro schema (ADR-0003). Conventions:
   - money = integer paise (`*_paise`); UI renders two-decimal ₹
   - GST amounts only; `hsn` stays NULL until OBD-20/OBD-11 resolve
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

export const products = pgTable("products", {
  sku: text("sku").primaryKey(),
  name: text("name").notNull(),
  catSlug: text("cat_slug").notNull().references(() => categories.slug),
  sub: text("sub").notNull(),
  img: text("img"), // null → labelled placeholder frame (no fake imagery)
  gallery: jsonb("gallery").$type<string[]>(),
  meta: text("meta").notNull().default(""),
  /** standard listed price, GST-inclusive (OBD-03) */
  stdPaise: integer("std_paise").notNull(),
  configurable: boolean("configurable").notNull().default(false),
  specs: jsonb("specs").$type<[string, string][]>().notNull(),
  directShip: boolean("direct_ship").notNull().default(false),
  /** stays NULL until OBD-20/OBD-11 (tax professional) */
  hsn: text("hsn"),
  active: boolean("active").notNull().default(true),
});

/** OBD-20 decided structure: discount before GST; individual overrides
 *  category. scope: 'category-default' (catSlug) | 'org-category'
 *  (orgId+catSlug) | 'org-product' (orgId+sku). */
export const priceRules = pgTable("price_rules", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(),
  orgId: integer("org_id").references(() => organizations.id),
  catSlug: text("cat_slug").references(() => categories.slug),
  sku: text("sku").references(() => products.sku),
  discountPct: integer("discount_pct_bp").notNull(), // basis points (1500 = 15%)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  destination: text("destination").notNull(), // 'warehouse' | 'direct' (OBD-19 Option C)
  issued: text("issued").notNull(),
  lineName: text("line_name").notNull(),
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
