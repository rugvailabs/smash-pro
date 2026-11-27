import "server-only";
import bcrypt from "bcryptjs";
import { and, asc, desc, eq, inArray, isNull, like, ne } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, hashPassword, requireAdmin, type SessionUser } from "@/server/auth";
import { notifyOrg } from "@/server/notifications";
import { BUYER_TYPES, isBuyerTypeKey, type BuyerTypeKey } from "@/lib/buyer-types";
import { resolveToPaise, visitorDiscountPct, type PriceMode } from "@/lib/pricing-calc";
import { normalizeGstPercent, normalizeHsn } from "@/lib/product-tax-fields";
import {
  normalizeColor, normalizeGroupKey, normalizeMsp, normalizeSize, normalizeSku, normalizeSupplierCode,
} from "@/lib/product-catalog-fields";
import { trustedImageHosts } from "@/server/storage";
import { SMASH_PRO_PROFILE } from "@/lib/company-profile";
import type {
  AdminAnalytics, AdminBrandRow, AdminComplaintRow, AdminCounts, AdminInvoiceablePo,
  AdminInvoiceDetail, AdminInvoiceRow, AdminOrderDetail, AdminOrderRow,
  AdminOrgFullRow, AdminOrgRow, AdminPaymentRow, AdminPoRow, AdminPriceRule,
  AdminProductRequestRow, AdminProductRow, AdminQuoteView, AdminReport,
  AdminRequirementDetail, AdminRequirementRow, AdminServiceRequestRow, AdminSiteContent, AuditLogPage, AuditLogRow,
  BuyerTypeDiscountRow, Reconciliation, ReconciliationRow, SupplierPerformanceRow,
} from "@/lib/admin-types";

/* ============================================================
   Super Admin service (B5) — decided workflows only: org
   approval/rejection, direct-shipment flag (OBD-19 Option C),
   payment verification (OBD-21), catalogue & price rules
   (OBD-20 decided structure), order fulfilment advances,
   procurement (requirements → quotations → POs), complaints and
   product requests. Pending OBD items (supplier commission,
   cancellation windows, verification checklists) are deliberately
   absent. Product HSN/GST% (ADR-0014) are optional admin-entered
   record-keeping fields only — not wired into any GST computation,
   which stays pending OBD-11/OBD-20 professional tax validation.
   Reads return null/empty for
   non-admin sessions; every mutation requireAdmin()s and
   appends to the audit log (PLT-003). Money is integer paise in
   the DB, two-decimal rupees at this boundary.
   ============================================================ */

const r = (p: number) => Math.round(p) / 100;

const fullDate = (d: Date = new Date()) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const shortDate = (d: Date = new Date()) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const timeOfDay = (d: Date = new Date()) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const rupees = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function adminSession(): Promise<SessionUser | null> {
  const s = await getSession();
  return s && s.role === "admin" ? s : null;
}

/** Leading integer of strings like "500", "40 sets", "1,500 units" — or null. */
function parseLeadingInt(text: string): number | null {
  const m = /^\s*(\d[\d,]*)/.exec(text);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/* ---------- transition rules (single source for reads + mutations) ---------- */

function nextOrderStatus(o: {
  status: string; direct: boolean; deliveryProofOnRecord: boolean;
}): { status: string; label: string } | null {
  if (o.status === "processing") return { status: "dispatched", label: "Dispatched" };
  if (o.status === "dispatched" && !o.direct) return { status: "delivered", label: "Delivered" };
  // direct orders close via buyer receipt confirmation — admin can only hand
  // over once a delivery proof is on record (OBD-19 proof-first sequence)
  if (o.status === "dispatched" && o.direct && o.deliveryProofOnRecord) {
    return { status: "confirm-receipt", label: "Confirm receipt" };
  }
  return null;
}

/** Admin PO lifecycle (PO contract): a PO is issued in the `issued` state and
 *  only the SUPPLIER moves `issued`→`acknowledged` and (direct)
 *  `acknowledged`→`awaiting-proof`→`delivered-proof`. The admin can only CLOSE
 *  a PO that has reached its admin-closeable state — a WAREHOUSE PO at
 *  `acknowledged`, or a DIRECT PO at `delivered-proof`. `issued` and
 *  `awaiting-proof` are the supplier's to move, so this returns null for them
 *  (and for any other non-closeable combination). */
function nextPoFulfilment(p: {
  fulfilment: string; destination: string;
}): { fulfilment: string; label: string } | null {
  if (p.fulfilment === "acknowledged" && p.destination === "warehouse") {
    return { fulfilment: "closed", label: "Received in full · closed" };
  }
  if (p.fulfilment === "delivered-proof" && p.destination === "direct") {
    return { fulfilment: "closed", label: "Received in full · closed" };
  }
  return null;
}

/* ---------- dashboard counts ---------- */

export async function adminCountsForSession(): Promise<AdminCounts | null> {
  if (!(await adminSession())) return null;
  const orgs = await db.select({ status: schema.organizations.status }).from(schema.organizations);
  const pays = await db.select({ status: schema.payments.status }).from(schema.payments);
  const comps = await db.select({ status: schema.complaints.status }).from(schema.complaints);
  const reqs = await db.select({ status: schema.requirements.status }).from(schema.requirements);
  const quotes = await db.select({ status: schema.quotations.status }).from(schema.quotations);
  const pos = await db.select({ f: schema.purchaseOrders.fulfilment }).from(schema.purchaseOrders);
  const preqs = await db.select({ status: schema.productRequests.status }).from(schema.productRequests);
  const svcs = await db.select({ status: schema.serviceRequests.status }).from(schema.serviceRequests);
  return {
    pendingOrgs: orgs.filter((x) => x.status === "pending").length,
    paymentsToVerify: pays.filter((x) => x.status === "awaiting-verification").length,
    openComplaints: comps.filter((x) => x.status === "open").length,
    requirementsOpen: reqs.filter((x) => x.status === "open" || x.status === "quoted-revision").length,
    quotesAwaitingAction: quotes.filter((x) => x.status === "submitted").length,
    posInFlight: pos.filter((x) => x.f !== "closed").length,
    productRequestsInReview: preqs.filter((x) => x.status === "in-review").length,
    serviceRequestsNew: svcs.filter((x) => x.status === "new").length,
  };
}

/* ---------- organizations (ADM-001/002) ---------- */

function composeOrg(
  org: typeof schema.organizations.$inferSelect,
  docs: { filename: string; state: string }[]
): AdminOrgRow {
  return {
    id: org.id,
    kind: org.kind as AdminOrgRow["kind"],
    status: org.status as AdminOrgRow["status"],
    name: org.name, legalName: org.legalName, orgType: org.orgType,
    gstin: org.gstin, city: org.city, contactName: org.contactName,
    contactPhone: org.contactPhone, email: org.email,
    requestedCategories: org.kind === "supplier" ? (org.approvedCategories ?? []) : null,
    directApproved: org.directApproved,
    submitted: fullDate(org.createdAt),
    documents: docs,
  };
}

export async function organizationsForAdmin(
  filter?: "pending" | "active" | "all"
): Promise<AdminOrgRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.organizations).orderBy(desc(schema.organizations.id));
  const docs = await db.select().from(schema.documents).orderBy(asc(schema.documents.id));
  const docsByOrg = new Map<number, { filename: string; state: string }[]>();
  for (const d of docs) {
    const list = docsByOrg.get(d.orgId) ?? [];
    list.push({ filename: d.filename, state: d.state });
    docsByOrg.set(d.orgId, list);
  }
  return rows
    .filter((o) => !filter || filter === "all" || o.status === filter)
    .map((o) => composeOrg(o, docsByOrg.get(o.id) ?? []));
}

export async function organizationForAdmin(id: number): Promise<AdminOrgRow | null> {
  if (!(await adminSession())) return null;
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
  if (!org) return null;
  const docs = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.orgId, org.id))
    .orderBy(asc(schema.documents.id));
  return composeOrg(org, docs.map((d) => ({ filename: d.filename, state: d.state })));
}

/** ADM-001/002 — approve a pending organization. For suppliers the admin
 *  reviews and SETS the approved category list at approval (audit finding:
 *  the self-declared request is overwritten, never trusted). */
export async function approveOrganization(orgId: number, approvedCategories?: string[]) {
  const s = await requireAdmin();
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (!org) throw new Error("404");
  if (org.status !== "pending") throw new Error("409");
  let categories: string[] | undefined;
  if (org.kind === "supplier") {
    if (!approvedCategories?.length) {
      throw new Error("400:Approved categories are required to approve a supplier");
    }
    const known = new Set(
      (await db.select({ slug: schema.categories.slug }).from(schema.categories)).map((c) => c.slug)
    );
    const bad = approvedCategories.filter((c) => !known.has(c));
    if (bad.length) throw new Error(`400:Unknown categories: ${bad.join(", ")}`);
    categories = [...new Set(approvedCategories)];
  }
  await db
    .update(schema.organizations)
    .set({ status: "active", ...(categories ? { approvedCategories: categories } : {}) })
    .where(eq(schema.organizations.id, orgId));
  await audit(s.userId, "org.approve", "organization", String(orgId),
    categories ? { approvedCategories: categories } : undefined);
}

/** ADM-001/002 — reject a pending organization (reason recorded). */
export async function rejectOrganization(orgId: number, reason: string) {
  const s = await requireAdmin();
  const trimmed = reason.trim();
  if (!trimmed || trimmed.length > 1000) throw new Error("400:A rejection reason is required");
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (!org) throw new Error("404");
  if (org.status !== "pending") throw new Error("409");
  await db
    .update(schema.organizations)
    .set({ status: "rejected" })
    .where(eq(schema.organizations.id, orgId));
  await audit(s.userId, "org.reject", "organization", String(orgId), { reason: trimmed });
}

/** OBD-19 Option C — direct-shipment approval is an admin-controlled flag on
 *  active supplier orgs. Evaluation criteria stay ◇ PROPOSED: no criteria
 *  logic here, just the flag and the audit record. */
export async function setDirectShipment(orgId: number, approved: boolean) {
  const s = await requireAdmin();
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (!org) throw new Error("404");
  if (org.kind !== "supplier" || org.status !== "active") throw new Error("409");
  await db
    .update(schema.organizations)
    .set({ directApproved: approved })
    .where(eq(schema.organizations.id, orgId));
  await audit(s.userId, "org.direct-shipment", "organization", String(orgId), { approved });
}

/* ---------- catalogue (ADM products) ---------- */

export async function productsForAdmin(): Promise<AdminProductRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db
    .select()
    .from(schema.products)
    .orderBy(asc(schema.products.catSlug), asc(schema.products.sku));
  const brands = await db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands);
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  return rows.map((p) => ({
    sku: p.sku, name: p.name, catSlug: p.catSlug, sub: p.sub, meta: p.meta,
    std: r(p.stdPaise), active: p.active, configurable: p.configurable,
    hasImg: p.img !== null, img: p.img, gallery: p.gallery ?? [],
    brand: p.brandId !== null ? brandName.get(p.brandId) ?? null : null,
    brandId: p.brandId,
    hsn: p.hsn, gstPercent: p.gstPercent,
    supplierCode: p.supplierCode, msp: p.mspPaise !== null ? r(p.mspPaise) : null,
    color: p.color, size: p.size, inStock: p.inStock, qty: p.qty,
    groupKey: p.groupKey,
    mrp: p.mrpPaise !== null ? r(p.mrpPaise) : null,
    purchase: p.purchasePaise !== null ? r(p.purchasePaise) : null,
    purchaseMode: p.purchaseMode as PriceMode | null, purchaseValue: p.purchaseValue,
    marginMode: p.marginMode as PriceMode | null, marginValue: p.marginValue,
  }));
}

/* ---------- brands (simple master list) ---------- */

export async function brandsForAdmin(): Promise<AdminBrandRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.brands).orderBy(asc(schema.brands.name));
  const products = await db.select({ brandId: schema.products.brandId }).from(schema.products);
  const counts = new Map<number, number>();
  for (const p of products) {
    if (p.brandId !== null) counts.set(p.brandId, (counts.get(p.brandId) ?? 0) + 1);
  }
  return rows.map((b) => ({
    id: b.id, name: b.name, notes: b.notes,
    productCount: counts.get(b.id) ?? 0,
  }));
}

export async function createBrand(input: { name: string; notes?: string }): Promise<{ id: number }> {
  const s = await requireAdmin();
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error("400:A brand name up to 120 characters is required");
  const notes = (input.notes ?? "").trim();
  if (notes.length > 300) throw new Error("400:Notes are too long");
  const [existing] = await db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.name, name));
  if (existing) throw new Error("409:A brand with this name already exists");
  const [row] = await db
    .insert(schema.brands)
    .values({ name, notes: notes || null })
    .returning({ id: schema.brands.id });
  await audit(s.userId, "brand.create", "brand", String(row.id), { name });
  return { id: row.id };
}

function assertStd(std: number) {
  if (typeof std !== "number" || !Number.isFinite(std) || std < 0.01 || std > 1_000_000) {
    throw new Error("400:Standard price must be between ₹0.01 and ₹10,00,000");
  }
}

/** Links to an ALREADY-APPROVED photo already committed under /img/ by the
 *  photography programme (ADR-0005: no file bytes handled by the app; no
 *  upload accepted here). Never a general URL — only this app's own
 *  approved-imagery tree, so this can't be used to attach unapproved or
 *  external imagery to a product. */
function assertImgPath(img: string): string {
  const trimmed = img.trim();
  if (/^\/img\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i.test(trimmed)) return trimmed;

  // ADR-0013 — also accept a URL from this app's own configured upload
  // storage (DigitalOcean Spaces/CDN), never an arbitrary external host
  try {
    const host = new URL(trimmed).host;
    if (trustedImageHosts().includes(host)) return trimmed;
  } catch {
    /* not a URL at all — falls through to the error below */
  }
  throw new Error(
    "400:Image must be an already-approved file under /img/ (e.g. /img/cricket/new-bat-hero.jpg) or an upload through this app's own storage — no other external URLs are accepted"
  );
}

/** Up to 3 additional images (4 total with the main `img`) — same path
 *  authority as `img` (assertImgPath), just applied to each entry. */
function assertGallery(gallery: unknown): string[] | null {
  if (gallery === undefined || gallery === null) return null;
  if (!Array.isArray(gallery)) throw new Error("400:Gallery must be a list of image paths");
  const cleaned = gallery.map((g) => String(g).trim()).filter((g) => g.length > 0);
  if (cleaned.length > 3) throw new Error("400:Up to 3 additional images are allowed (4 total with the main image)");
  return cleaned.length > 0 ? cleaned.map(assertImgPath) : null;
}

function assertMode(mode: unknown, label: string): PriceMode {
  if (mode !== "percent" && mode !== "fixed") {
    throw new Error(`400:${label} mode must be "percent" or "fixed"`);
  }
  return mode;
}

function assertEntryValue(value: unknown, mode: PriceMode, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`400:${label} must be a non-negative number`);
  }
  if (mode === "percent" && value > 1000) {
    throw new Error(`400:${label} percentage looks out of range (max 1000%)`);
  }
  if (mode === "fixed" && value > 1_000_000) {
    throw new Error(`400:${label} amount looks out of range (max ₹10,00,000)`);
  }
  return value;
}

function assertQty(qty: unknown): number {
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 0 || qty > 1_000_000) {
    throw new Error("400:Quantity must be a whole number between 0 and 1,000,000");
  }
  return qty;
}

function assertSpecs(specs: [string, string][]) {
  const ok =
    Array.isArray(specs) && specs.length <= 40 &&
    specs.every(
      (x) =>
        Array.isArray(x) && x.length === 2 &&
        typeof x[0] === "string" && typeof x[1] === "string" &&
        x[0].length <= 200 && x[1].length <= 400
    );
  if (!ok) throw new Error("400:Specs must be label/value string pairs");
}

/** Create a catalogue product. img links an ALREADY-APPROVED file already
 *  committed under /img/ by the photography programme — it stays null
 *  until the admin supplies that path (no upload, no placeholder imagery).
 *  hsn/gstPercent (ADR-0014) are optional, admin-entered record-keeping
 *  fields only — format/range-checked, never classification-validated —
 *  and are NOT read by any pricing/GST calculation (OBD-11/OBD-20 pending
 *  professional tax validation for that). */
export async function createProduct(input: {
  sku: string; name: string; catSlug: string; sub: string;
  meta?: string; specs?: [string, string][];
  mrp: number; // ₹, the cut-off/MRP price
  purchaseMode: PriceMode; purchaseValue: number; // dealer/purchase price entry
  marginMode: PriceMode; marginValue: number; // ProSmash margin entry
  brandId?: number | null;
  img?: string | null;
  /** up to 3 additional images (4 total with `img`) */
  gallery?: string[] | null;
  hsn?: string | null;
  gstPercent?: number | null;
  supplierCode?: string | null;
  msp?: number | null; // ₹, optional third reference price (ADR-0015)
  color?: string | null;
  size?: string | null;
  inStock?: boolean;
  qty?: number;
  groupKey?: string | null;
}): Promise<{ sku: string }> {
  const s = await requireAdmin();
  const sku = normalizeSku(input.sku);
  const name = input.name.trim();
  const sub = input.sub.trim();
  const meta = (input.meta ?? "").trim();
  if (!name || name.length > 200) throw new Error("400:A product name up to 200 characters is required");
  if (!sub || sub.length > 120) throw new Error("400:A subtitle up to 120 characters is required");
  if (meta.length > 300) throw new Error("400:Meta is too long");
  assertStd(input.mrp); // same ₹0.01–₹10,00,000 sanity bounds as a listed price
  const purchaseMode = assertMode(input.purchaseMode, "Purchase price");
  const purchaseValue = assertEntryValue(input.purchaseValue, purchaseMode, "Purchase price");
  const marginMode = assertMode(input.marginMode, "Margin");
  const marginValue = assertEntryValue(input.marginValue, marginMode, "Margin");
  const hsn = normalizeHsn(input.hsn);
  const gstPercent = normalizeGstPercent(input.gstPercent);
  const supplierCode = normalizeSupplierCode(input.supplierCode);
  const mspPaise = normalizeMsp(input.msp);
  const color = normalizeColor(input.color);
  const size = normalizeSize(input.size);
  const inStock = input.inStock ?? true;
  const qty = assertQty(input.qty ?? 1);
  const groupKey = normalizeGroupKey(input.groupKey);
  const specs = input.specs ?? [];
  assertSpecs(specs);

  let brandId: number | null = null;
  if (input.brandId !== undefined && input.brandId !== null) {
    const [b] = await db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.id, input.brandId));
    if (!b) throw new Error("400:Unknown brand");
    brandId = b.id;
  }
  const img = input.img ? assertImgPath(input.img) : null;
  const gallery = assertGallery(input.gallery);

  // resolved server-side from the raw entries — never trust a client-submitted total.
  // Purchase price % is of MRP; margin % is of the resolved Purchase price,
  // not MRP (OBD-23 amendment, 2026-11-20 — corrects the assumption flagged in ADR-0011).
  const mrpPaise = Math.round(input.mrp * 100);
  const purchasePaise = resolveToPaise(purchaseMode, purchaseValue, mrpPaise);
  const marginPaise = resolveToPaise(marginMode, marginValue, purchasePaise);
  const stdPaise = purchasePaise + marginPaise; // visitor selling price
  assertStd(stdPaise / 100);

  const [cat] = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, input.catSlug));
  if (!cat) throw new Error("400:Unknown category");
  const [existing] = await db
    .select({ sku: schema.products.sku })
    .from(schema.products)
    .where(eq(schema.products.sku, sku));
  if (existing) throw new Error("409");
  await db.insert(schema.products).values({
    sku, name, catSlug: cat.slug, sub, meta, brandId,
    stdPaise, mrpPaise,
    purchaseMode, purchaseValue, purchasePaise,
    marginMode, marginValue, marginPaise,
    img, gallery, hsn, gstPercent,
    supplierCode, mspPaise, color, size, inStock, qty, groupKey,
    configurable: false, directShip: false, specs, active: true,
  });
  await audit(s.userId, "product.create", "product", sku, {
    catSlug: cat.slug, mrp: input.mrp,
    purchaseMode, purchaseValue, purchasePaise,
    marginMode, marginValue, marginPaise,
    brandId, img, hsn, gstPercent,
    supplierCode, msp: mspPaise !== null ? r(mspPaise) : null, color, size, inStock, qty, groupKey,
    std: r(stdPaise),
  });
  return { sku };
}

/** Full row edit — backs the Products table's "Edit" action (every field
 *  shown as a table column, consolidated into one save). Toggle active/
 *  inStock, update the standard price, name/category/sub/brand/meta,
 *  re-link the product's image (same assertImgPath authority as creation —
 *  upload/library/known path only, never an arbitrary external URL), set
 *  its HSN code / GST % / supplier code / MSP / colour / size
 *  (ADR-0014/ADR-0015 — admin-entered record-keeping fields only, never
 *  read by any pricing/GST calculation), and/or change its ProSmash
 *  margin (ADR-0017 amendment — needed so a batch-imported product's
 *  placeholder margin can be corrected per-row afterward): recomputes
 *  `marginPaise`/`stdPaise` from the margin entry against the product's
 *  EXISTING stored `purchasePaise` — the dealer price itself is not
 *  editable here. MRP/Dealer-price entry stay creation-only per
 *  ADR-0011 — not retrofitted; `std` remains the one direct price
 *  override when margin isn't the thing being corrected. */
export async function updateProduct(
  sku: string,
  patch: {
    active?: boolean; std?: number; img?: string | null; gallery?: string[] | null;
    hsn?: string | null; gstPercent?: number | null;
    supplierCode?: string | null; msp?: number | null;
    color?: string | null; size?: string | null; inStock?: boolean; qty?: number;
    name?: string; catSlug?: string; sub?: string; meta?: string;
    brandId?: number | null; groupKey?: string | null;
    marginMode?: PriceMode; marginValue?: number;
  }
) {
  const s = await requireAdmin();
  const nothing =
    patch.active === undefined && patch.std === undefined && patch.img === undefined &&
    patch.gallery === undefined &&
    patch.hsn === undefined && patch.gstPercent === undefined &&
    patch.supplierCode === undefined && patch.msp === undefined &&
    patch.color === undefined && patch.size === undefined && patch.inStock === undefined &&
    patch.qty === undefined &&
    patch.name === undefined && patch.catSlug === undefined && patch.sub === undefined &&
    patch.meta === undefined && patch.brandId === undefined && patch.groupKey === undefined &&
    patch.marginMode === undefined && patch.marginValue === undefined;
  if (nothing) throw new Error("400:Nothing to update");
  const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  if (!p) throw new Error("404");
  const set: {
    active?: boolean; stdPaise?: number; img?: string | null; gallery?: string[] | null;
    hsn?: string | null; gstPercent?: number | null;
    supplierCode?: string | null; mspPaise?: number | null;
    color?: string | null; size?: string | null; inStock?: boolean; qty?: number;
    name?: string; catSlug?: string; sub?: string; meta?: string;
    brandId?: number | null; groupKey?: string | null;
    marginMode?: PriceMode; marginValue?: number; marginPaise?: number;
  } = {};
  if (patch.active !== undefined) {
    if (typeof patch.active !== "boolean") throw new Error("400:active must be true or false");
    set.active = patch.active;
  }
  if (patch.std !== undefined) {
    assertStd(patch.std);
    set.stdPaise = Math.round(patch.std * 100);
  }
  if (patch.marginMode !== undefined || patch.marginValue !== undefined) {
    if (p.purchasePaise === null) {
      throw new Error("400:This product has no dealer/purchase price on record — margin can't be recalculated");
    }
    const marginMode = assertMode(patch.marginMode, "Margin");
    const marginValue = assertEntryValue(patch.marginValue, marginMode, "Margin");
    const marginPaise = resolveToPaise(marginMode, marginValue, p.purchasePaise);
    const stdPaise = p.purchasePaise + marginPaise;
    assertStd(stdPaise / 100);
    set.marginMode = marginMode;
    set.marginValue = marginValue;
    set.marginPaise = marginPaise;
    set.stdPaise = stdPaise;
  }
  if (patch.img !== undefined) {
    set.img = patch.img ? assertImgPath(patch.img) : null;
  }
  if (patch.gallery !== undefined) {
    set.gallery = assertGallery(patch.gallery);
  }
  if (patch.hsn !== undefined) {
    set.hsn = normalizeHsn(patch.hsn);
  }
  if (patch.gstPercent !== undefined) {
    set.gstPercent = normalizeGstPercent(patch.gstPercent);
  }
  if (patch.supplierCode !== undefined) {
    set.supplierCode = normalizeSupplierCode(patch.supplierCode);
  }
  if (patch.msp !== undefined) {
    set.mspPaise = normalizeMsp(patch.msp);
  }
  if (patch.color !== undefined) {
    set.color = normalizeColor(patch.color);
  }
  if (patch.size !== undefined) {
    set.size = normalizeSize(patch.size);
  }
  if (patch.inStock !== undefined) {
    if (typeof patch.inStock !== "boolean") throw new Error("400:inStock must be true or false");
    set.inStock = patch.inStock;
  }
  if (patch.qty !== undefined) {
    set.qty = assertQty(patch.qty);
  }
  if (patch.groupKey !== undefined) {
    set.groupKey = normalizeGroupKey(patch.groupKey);
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name || name.length > 200) throw new Error("400:A product name up to 200 characters is required");
    set.name = name;
  }
  if (patch.sub !== undefined) {
    const sub = patch.sub.trim();
    if (!sub || sub.length > 120) throw new Error("400:A subtitle up to 120 characters is required");
    set.sub = sub;
  }
  if (patch.meta !== undefined) {
    const meta = patch.meta.trim();
    if (meta.length > 300) throw new Error("400:Meta is too long");
    set.meta = meta;
  }
  if (patch.catSlug !== undefined) {
    const [cat] = await db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.slug, patch.catSlug));
    if (!cat) throw new Error("400:Unknown category");
    set.catSlug = cat.slug;
  }
  if (patch.brandId !== undefined) {
    if (patch.brandId !== null) {
      const [b] = await db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.id, patch.brandId));
      if (!b) throw new Error("400:Unknown brand");
    }
    set.brandId = patch.brandId;
  }
  await db.update(schema.products).set(set).where(eq(schema.products.sku, sku));
  await audit(s.userId, "product.update", "product", sku, patch);
}

/* ---------- bulk catalogue import (ADR-0017, supplier stock sheets) ---------- */

/** Resolves `count` fresh `<prefix>-####` SKUs, continuing after the
 *  highest existing number under that prefix — so a repeat import never
 *  collides with a previous one. Not transactionally safe against a
 *  concurrent import (acceptable for an occasional admin-only tool). */
export async function nextSkuSequence(prefix: string, count: number): Promise<string[]> {
  if (!/^[A-Z]{2}$/.test(prefix)) throw new Error("400:SKU prefix must be two letters");
  const existing = await db
    .select({ sku: schema.products.sku })
    .from(schema.products)
    .where(like(schema.products.sku, `${prefix}-%`));
  let max = 0;
  for (const { sku } of existing) {
    const m = /^[A-Z]{2}-(\d{4})$/.exec(sku);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push(`${prefix}-${String(max + i).padStart(4, "0")}`);
  return out;
}

export interface ImportCommitRow {
  sku: string; name: string;
  mrp: number | null; dealerExGst: number | null; msp: number | null;
  gstPercent: number | null; supplierCode: string; color: string | null; size: string | null;
  inStock: boolean; groupKey: string;
  /** per-row subcategory (auto-detected or admin-edited in the preview) —
   *  falls back to the batch default, then "Imported", when absent. */
  sub?: string | null;
  /** sheet-provided image path(s) (ADR-0017 follow-up — column mapping can
   *  now point at a supplier template's own image-path columns, e.g. a
   *  Yonex upload sheet's "Image 1/2 Path"); same assertImgPath authority
   *  as the Add Product form — an approved `/img/...` path only, never
   *  trusted as an arbitrary external URL. */
  img?: string | null;
  gallery?: string[] | null;
}

/** Bulk-creates products from a parsed supplier stock sheet (ADR-0017 —
 *  the Excel importer). Category/brand/margin apply uniformly to the
 *  whole batch (the sheet carries no per-row category, and margin is a
 *  ProSmash decision the sheet doesn't make) — `catSlug` is correct
 *  uniform for a single-sport supplier sheet (the only kind seen so
 *  far). Subcategory is NOT uniform: a real stock sheet spans several
 *  genuinely different ones (rackets, shoes, bags, apparel…), so each
 *  row carries its OWN `sub` (the preview's auto-detected guess, admin-
 *  overridden where shown) — `input.sub` is only the BATCH DEFAULT
 *  applied to rows with no `sub` of their own, falling back further to
 *  "Imported" if that's blank too. `marginMode`/`marginValue` are
 *  OPTIONAL: left blank, margin defaults to 0% (std = dealer price, i.e.
 *  no markup yet — a deliberately visible placeholder, safe because the
 *  batch still imports inactive by default). Admin re-classifies/re-
 *  prices individual rows afterward via the Edit action, which now also
 *  supports changing margin (recomputing std from the row's own stored
 *  dealer price).
 *  Dealer price is entered FIXED (the sheet's own pre-tax "W.O GST"
 *  figure), same `purchasePaise = resolveToPaise(...)` / `stdPaise =
 *  purchasePaise + marginPaise` chain as createProduct (OBD-23). Rows
 *  that fail validation are skipped and reported, not allowed to abort
 *  the whole batch. Imports as `active: false` unless `activate` is set
 *  — nothing goes live in the catalogue until admin confirms pricing.
 *  ADR-0019: a stock sheet often lists the same product as several
 *  identical repeated rows (one per physical unit) rather than one row
 *  with a count — rows whose name/sub/colour/size/prices/GST/group all
 *  match exactly are collapsed into ONE product with `qty` = how many
 *  repeats were found; anything differing (crucially size or colour)
 *  stays a separate product, same as before. */
export async function bulkImportProducts(input: {
  rows: ImportCommitRow[];
  catSlug: string;
  sub?: string;
  brandId: number | null;
  marginMode?: PriceMode;
  marginValue?: number;
  activate: boolean;
}): Promise<{ created: number; mergedDuplicates: number; failed: { sku: string; error: string }[] }> {
  const s = await requireAdmin();
  const [cat] = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, input.catSlug));
  if (!cat) throw new Error("400:Unknown category");
  const defaultSubTrimmed = (input.sub ?? "").trim();
  if (defaultSubTrimmed.length > 120) throw new Error("400:Subcategory must be 120 characters or fewer");
  const defaultSub = defaultSubTrimmed || "Imported";
  if (input.brandId !== null) {
    const [b] = await db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.id, input.brandId));
    if (!b) throw new Error("400:Unknown brand");
  }
  const marginMode = assertMode(input.marginMode ?? "percent", "Margin");
  const marginValue = assertEntryValue(input.marginValue ?? 0, marginMode, "Margin");

  const failed: { sku: string; error: string }[] = [];
  const seenSku = new Set<string>();
  // Exact duplicates (same name/sub/colour/size/prices/GST/group — i.e. the
  // SAME product repeated as separate rows, as supplier stock sheets often
  // do, one row per physical unit) collapse into ONE product row with `qty`
  // = how many repeats were found, instead of creating N identical-looking
  // catalogue entries. Rows that differ in size (or anything else in the
  // key) are genuinely different products/variants and stay separate.
  const merged = new Map<string, { row: typeof schema.products.$inferInsert; qty: number }>();

  for (const r of input.rows) {
    try {
      if (seenSku.has(r.sku)) throw new Error("duplicate SKU in this batch");
      if (!/^[A-Z]{2}-\d{4}$/.test(r.sku)) throw new Error("SKU must match the pattern AB-0000");
      if (r.mrp === null || r.mrp <= 0) throw new Error("missing MRP");
      if (r.dealerExGst === null || r.dealerExGst <= 0) throw new Error("missing dealer price");
      assertStd(r.mrp);
      const mrpPaise = Math.round(r.mrp * 100);
      const purchasePaise = resolveToPaise("fixed", r.dealerExGst, mrpPaise);
      const marginPaise = resolveToPaise(marginMode, marginValue, purchasePaise);
      const stdPaise = purchasePaise + marginPaise;
      assertStd(stdPaise / 100);

      const name = r.name.trim().slice(0, 200) || r.sku;
      const gstPercent = normalizeGstPercent(r.gstPercent);
      const supplierCode = normalizeSupplierCode(r.supplierCode);
      const mspPaise = r.msp !== null ? normalizeMsp(r.msp) : null;
      const color = normalizeColor(r.color);
      const size = normalizeSize(r.size);
      const groupKey = normalizeGroupKey(r.groupKey);
      const rowSubTrimmed = (r.sub ?? "").trim();
      if (rowSubTrimmed.length > 120) throw new Error("400:Subcategory must be 120 characters or fewer");
      const sub = rowSubTrimmed || defaultSub;
      // already filtered to approved /img/... paths by the parser
      // (lib/excel-import-mapping.ts) — re-validated here anyway, same
      // authority as every other image-setting path in this app.
      const img = r.img ? assertImgPath(r.img) : null;
      const gallery = assertGallery(r.gallery);

      seenSku.add(r.sku);
      // groupKey is deliberately NOT part of this key — real supplier sheets
      // have been seen assigning two different group codes to what is
      // otherwise an identical row (same name/colour/size/prices), so
      // trusting it here under-merges true duplicates.
      const dedupeKey = [name, sub, color ?? "", size ?? "", gstPercent ?? "", mrpPaise, purchasePaise].join("|");
      const existingGroup = merged.get(dedupeKey);
      if (existingGroup) {
        existingGroup.qty += 1;
        if (r.inStock) existingGroup.row.inStock = true;
      } else {
        merged.set(dedupeKey, {
          qty: 1,
          row: {
            sku: r.sku, name, catSlug: cat.slug, sub, meta: "", brandId: input.brandId,
            stdPaise, mrpPaise,
            purchaseMode: "fixed", purchaseValue: r.dealerExGst, purchasePaise,
            marginMode, marginValue, marginPaise,
            img, gallery, hsn: null, gstPercent,
            supplierCode, mspPaise, color, size, inStock: r.inStock, groupKey,
            configurable: false, directShip: false, specs: [], active: input.activate,
          },
        });
      }
    } catch (e) {
      failed.push({ sku: r.sku, error: e instanceof Error ? e.message.replace(/^\d+:/, "") : "invalid row" });
    }
  }

  const toInsert = [...merged.values()].map(({ row, qty }) => ({ ...row, qty }));
  const validRows = toInsert.reduce((sum, p) => sum + p.qty, 0);
  const mergedDuplicates = validRows - toInsert.length;

  if (toInsert.length > 0) {
    const [existing] = await db
      .select({ sku: schema.products.sku })
      .from(schema.products)
      .where(inArray(schema.products.sku, toInsert.map((p) => p.sku)));
    if (existing) throw new Error(`400:SKU ${existing.sku} already exists — refresh the preview and retry`);
    await db.insert(schema.products).values(toInsert);
  }
  await audit(s.userId, "product.bulk-import", "product", `${toInsert.length} rows`, {
    catSlug: cat.slug, defaultSub, brandId: input.brandId, marginMode, marginValue,
    created: toInsert.length, mergedDuplicates, failedCount: failed.length,
  });
  return { created: toInsert.length, mergedDuplicates, failed };
}

/* ---------- price rules (OBD-20 decided structure) ---------- */

export async function priceRulesForAdmin(): Promise<AdminPriceRule[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.priceRules).orderBy(asc(schema.priceRules.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return rows.map((x) => ({
    id: x.id,
    scope: x.scope as AdminPriceRule["scope"],
    orgId: x.orgId,
    orgName: x.orgId !== null ? (orgName.get(x.orgId) ?? null) : null,
    catSlug: x.catSlug,
    sku: x.sku,
    discountBp: x.discountPct,
  }));
}

/** OBD-20 decided mechanics: discount before GST, basis points, Option A
 *  precedence resolved at read time (pricing.ts) — rules here only store. */
export async function createPriceRule(input: {
  scope: string; orgId?: number; catSlug?: string; sku?: string; discountBp: number;
}): Promise<{ id: number }> {
  const s = await requireAdmin();
  if (!Number.isInteger(input.discountBp) || input.discountBp < 0 || input.discountBp > 9000) {
    throw new Error("400:Discount must be a whole number of basis points between 0 and 9000");
  }

  const needsOrg = input.scope === "org-category" || input.scope === "org-product";
  const needsCat = input.scope === "category-default" || input.scope === "org-category";
  const needsSku = input.scope === "org-product";
  if (!needsOrg && !needsCat && !needsSku) throw new Error("400:Unknown rule scope");

  let orgId: number | null = null;
  if (needsOrg) {
    if (!input.orgId) throw new Error("400:An organization is required for this scope");
    const [org] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, input.orgId));
    if (!org) throw new Error("400:Unknown organization");
    orgId = org.id;
  }
  let catSlug: string | null = null;
  if (needsCat) {
    if (!input.catSlug) throw new Error("400:A category is required for this scope");
    const [cat] = await db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.slug, input.catSlug));
    if (!cat) throw new Error("400:Unknown category");
    catSlug = cat.slug;
  }
  let sku: string | null = null;
  if (needsSku) {
    if (!input.sku) throw new Error("400:A product SKU is required for this scope");
    const [p] = await db
      .select({ sku: schema.products.sku })
      .from(schema.products)
      .where(eq(schema.products.sku, input.sku.toUpperCase()));
    if (!p) throw new Error("400:Unknown product");
    sku = p.sku;
  }

  const dup = await db
    .select({ id: schema.priceRules.id })
    .from(schema.priceRules)
    .where(
      input.scope === "category-default"
        ? and(
            eq(schema.priceRules.scope, "category-default"),
            eq(schema.priceRules.catSlug, catSlug!),
            isNull(schema.priceRules.orgId)
          )
        : input.scope === "org-category"
          ? and(
              eq(schema.priceRules.scope, "org-category"),
              eq(schema.priceRules.orgId, orgId!),
              eq(schema.priceRules.catSlug, catSlug!)
            )
          : and(
              eq(schema.priceRules.scope, "org-product"),
              eq(schema.priceRules.orgId, orgId!),
              eq(schema.priceRules.sku, sku!)
            )
    );
  if (dup.length) throw new Error("409");

  const [row] = await db
    .insert(schema.priceRules)
    .values({ scope: input.scope, orgId, catSlug, sku, discountPct: input.discountBp })
    .returning();
  await audit(s.userId, "price-rule.create", "price_rule", String(row.id), {
    scope: input.scope, orgId, catSlug, sku, discountBp: input.discountBp,
  });
  return { id: row.id };
}

export async function deletePriceRule(id: number) {
  const s = await requireAdmin();
  const [rule] = await db.select().from(schema.priceRules).where(eq(schema.priceRules.id, id));
  if (!rule) throw new Error("404");
  await db.delete(schema.priceRules).where(eq(schema.priceRules.id, id));
  await audit(s.userId, "price-rule.delete", "price_rule", String(id), {
    scope: rule.scope, orgId: rule.orgId, catSlug: rule.catSlug, sku: rule.sku,
  });
}

/* ---------- buyer-category discounts (OBD-05 revised) ----------
   One rate per buyer organisation type, applied to ALL products in
   ALL categories for every approved buyer of that type. Percentages
   at the boundary; stored as basis points. Max one row per type. */

const MAX_DISCOUNT_BP = 9000; // 90% ceiling (mirrors the legacy bound)

/** Returns all four buyer types with their current rate (percent), active
 *  state and whether a rate has been configured — so the admin table always
 *  shows the full set of buyer categories. */
export async function buyerTypeDiscountsForAdmin(): Promise<BuyerTypeDiscountRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.buyerTypeDiscounts);
  const byType = new Map(rows.map((x) => [x.buyerType, x]));
  return BUYER_TYPES.map((t) => {
    const row = byType.get(t.key);
    return {
      buyerType: t.key,
      label: t.label,
      coverage: "All Products",
      configured: row !== undefined,
      discountPct: row ? row.discountBp / 100 : 0,
      active: row ? row.active : false,
    };
  });
}

function bpFromPercent(pct: number): number {
  if (!Number.isFinite(pct) || pct < 0 || pct > MAX_DISCOUNT_BP / 100) {
    throw new Error("400:Discount must be a percentage between 0 and 90");
  }
  const bp = Math.round(pct * 100); // 12.5% → 1250 bp
  if (!Number.isInteger(bp) || bp < 0 || bp > MAX_DISCOUNT_BP) {
    throw new Error("400:Discount must be a percentage between 0 and 90");
  }
  return bp;
}

/** Create or edit the rate for a buyer type (upsert — one row per type).
 *  `active` defaults to true so creating a rate enables it. */
export async function upsertBuyerTypeDiscount(input: {
  buyerType: string; discountPct: number; active?: boolean;
}): Promise<{ buyerType: BuyerTypeKey; discountPct: number; active: boolean }> {
  const s = await requireAdmin();
  if (!isBuyerTypeKey(input.buyerType)) throw new Error("400:Unknown buyer category");
  const bp = bpFromPercent(input.discountPct);
  const active = input.active ?? true;

  const [existing] = await db
    .select({ id: schema.buyerTypeDiscounts.id })
    .from(schema.buyerTypeDiscounts)
    .where(eq(schema.buyerTypeDiscounts.buyerType, input.buyerType));
  if (existing) {
    await db
      .update(schema.buyerTypeDiscounts)
      .set({ discountBp: bp, active, updatedAt: new Date() })
      .where(eq(schema.buyerTypeDiscounts.id, existing.id));
  } else {
    await db
      .insert(schema.buyerTypeDiscounts)
      .values({ buyerType: input.buyerType, discountBp: bp, active });
  }
  await audit(s.userId, "buyer-discount.upsert", "buyer_type_discount", input.buyerType, {
    discountBp: bp, active,
  });
  return { buyerType: input.buyerType, discountPct: bp / 100, active };
}

/** Activate / deactivate a buyer type's rate without deleting it. */
export async function setBuyerTypeDiscountActive(buyerType: string, active: boolean) {
  const s = await requireAdmin();
  if (!isBuyerTypeKey(buyerType)) throw new Error("400:Unknown buyer category");
  const [existing] = await db
    .select({ id: schema.buyerTypeDiscounts.id })
    .from(schema.buyerTypeDiscounts)
    .where(eq(schema.buyerTypeDiscounts.buyerType, buyerType));
  if (!existing) throw new Error("404");
  await db
    .update(schema.buyerTypeDiscounts)
    .set({ active, updatedAt: new Date() })
    .where(eq(schema.buyerTypeDiscounts.id, existing.id));
  await audit(s.userId, "buyer-discount.active", "buyer_type_discount", buyerType, { active });
}

/** Remove a buyer type's rate entirely — that type reverts to the standard
 *  listed price for its approved buyers. */
export async function removeBuyerTypeDiscount(buyerType: string) {
  const s = await requireAdmin();
  if (!isBuyerTypeKey(buyerType)) throw new Error("400:Unknown buyer category");
  const [existing] = await db
    .select()
    .from(schema.buyerTypeDiscounts)
    .where(eq(schema.buyerTypeDiscounts.buyerType, buyerType));
  if (!existing) throw new Error("404");
  await db.delete(schema.buyerTypeDiscounts).where(eq(schema.buyerTypeDiscounts.id, existing.id));
  await audit(s.userId, "buyer-discount.remove", "buyer_type_discount", buyerType, {
    discountBp: existing.discountBp,
  });
}

/* ---------- orders & payments (ADM-016 / OBD-21) ---------- */

export async function ordersForAdmin(): Promise<AdminOrderRow[]> {
  if (!(await adminSession())) return [];
  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const pays = await db.select().from(schema.payments);
  const lines = await db
    .select({ orderId: schema.orderLines.orderId })
    .from(schema.orderLines);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const payByOrder = new Map(pays.map((p) => [p.orderId, p]));
  const lineCount = new Map<string, number>();
  for (const l of lines) lineCount.set(l.orderId, (lineCount.get(l.orderId) ?? 0) + 1);
  return orders.map((o) => {
    const pay = payByOrder.get(o.id);
    return {
      id: o.id,
      orgName: orgName.get(o.orgId) ?? "",
      placed: o.placed,
      status: o.status, statusLabel: o.statusLabel, direct: o.direct,
      total: r(o.totalPaise),
      paymentStatus: pay?.status ?? "",
      paymentStatusLabel: pay?.statusLabel ?? "",
      lineCount: lineCount.get(o.id) ?? 0,
    };
  });
}

export async function orderForAdmin(id: string): Promise<AdminOrderDetail | null> {
  if (!(await adminSession())) return null;
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!o) return null;
  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, o.orgId));
  const lines = await db
    .select()
    .from(schema.orderLines)
    .where(eq(schema.orderLines.orderId, o.id))
    .orderBy(asc(schema.orderLines.id));
  const [pay] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, o.id));
  const comps = await db
    .select()
    .from(schema.complaints)
    .where(eq(schema.complaints.orderId, o.id))
    .orderBy(asc(schema.complaints.id));
  return {
    id: o.id,
    orgName: org?.name ?? "",
    placed: o.placed,
    status: o.status, statusLabel: o.statusLabel, direct: o.direct,
    total: r(o.totalPaise),
    paymentStatus: pay?.status ?? "",
    paymentStatusLabel: pay?.statusLabel ?? "",
    lineCount: lines.length,
    shipTo: o.shipTo,
    deliveryMethod: o.deliveryMethod as "managed" | "self-pickup" | "self-courier",
    pickupNote: o.pickupNote,
    rail: o.rail,
    lines: lines.map((l) => ({
      sku: l.sku, name: l.name, qty: l.qty,
      unit: r(l.unitPaise), total: r(l.unitPaise * l.qty),
    })),
    subtotalExGst: r(o.subtotalExGstPaise),
    gst: r(o.gstPaise),
    shipping: r(o.shippingPaise ?? 0),
    payment: {
      method: pay?.method ?? "",
      reference: pay?.reference ?? null,
      declaredAmount: pay?.declaredAmountPaise != null ? r(pay.declaredAmountPaise) : null,
      proofFilename: pay?.proofFilename ?? null,
      proofUploadedAt: pay?.proofUploadedAt ?? null,
    },
    nextStatus: nextOrderStatus(o),
    complaints: comps.map((c) => ({
      id: c.id, body: c.body, status: c.status, created: fullDate(c.createdAt),
    })),
  };
}

export async function paymentsForAdmin(): Promise<AdminPaymentRow[]> {
  if (!(await adminSession())) return [];
  const pays = await db.select().from(schema.payments);
  const orders = await db
    .select({ id: schema.orders.id, orgId: schema.orders.orgId, totalPaise: schema.orders.totalPaise })
    .from(schema.orders);
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return pays
    .map((p) => {
      const o = orderById.get(p.orderId);
      return {
        orderId: p.orderId,
        orgName: o ? (orgName.get(o.orgId) ?? "") : "",
        method: p.method,
        status: p.status, statusLabel: p.statusLabel,
        total: o ? r(o.totalPaise) : 0,
        declaredAmount: p.declaredAmountPaise != null ? r(p.declaredAmountPaise) : null,
        proofFilename: p.proofFilename ?? null,
        proofUploadedAt: p.proofUploadedAt ?? null,
      };
    })
    .sort((a, b) => b.orderId.localeCompare(a.orderId));
}

/** ADM-016 — verify an offline payment (OBD-21 decided path):
 *  payment → confirmed, order → processing, rail advances. */
export async function verifyPayment(orderId: string) {
  const s = await requireAdmin();
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!o) throw new Error("404");
  const [pay] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId));
  if (!pay || pay.status !== "awaiting-verification") throw new Error("409");
  const date = fullDate();
  const short = shortDate();
  await db
    .update(schema.payments)
    .set({ status: "confirmed", statusLabel: "Payment confirmed", confirmedAt: date, verifiedByUserId: s.userId })
    .where(eq(schema.payments.orderId, orderId));
  const rail = o.rail.map((step) => (step.state === "cur" ? { ...step, state: "done" as const } : step));
  const confIdx = rail.findIndex((x) => x.label === "Confirmed");
  if (confIdx >= 0) rail[confIdx] = { ...rail[confIdx], date: short, state: "done" };
  const procIdx = rail.findIndex((x) => x.label === "Processing");
  if (procIdx >= 0) rail[procIdx] = { ...rail[procIdx], date: short, state: "cur" };
  await db
    .update(schema.orders)
    .set({ status: "processing", statusLabel: "Processing", rail })
    .where(eq(schema.orders.id, orderId));
  await audit(s.userId, "payment.verify", "order", orderId);
}

/** Advance an order one legal fulfilment step (no cancellation anywhere —
 *  OBD-17 cancellation windows stay ◇ PROPOSED). */
export async function advanceOrder(orderId: string) {
  const s = await requireAdmin();
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!o) throw new Error("404");
  const next = nextOrderStatus(o);
  if (!next) throw new Error("409");
  const date = fullDate();
  const short = shortDate();
  const rail = o.rail.map((step) =>
    step.state === "cur" ? { ...step, date: step.date ?? short, state: "done" as const } : step
  );
  if (next.status === "dispatched") {
    const i = rail.findIndex((x) => x.label === "Dispatched");
    if (i >= 0) rail[i] = { ...rail[i], date: short, state: "cur" };
    await db
      .update(schema.orders)
      .set({
        status: "dispatched", statusLabel: "Dispatched", rail,
        dispatchedAt: date,
        // demo transport reference — logistics integration not selected
        transportRef: `LR-90${orderId.slice(-3)}`,
      })
      .where(eq(schema.orders.id, orderId));
  } else if (next.status === "delivered") {
    const i = rail.findIndex((x) => x.label === "Delivered");
    if (i >= 0) rail[i] = { ...rail[i], date: short, state: "done" };
    await db
      .update(schema.orders)
      .set({ status: "delivered", statusLabel: "Delivered", rail, deliveredOn: date })
      .where(eq(schema.orders.id, orderId));
  } else {
    // direct order with proof on record → buyer must confirm receipt
    const i = rail.findIndex((x) => x.label === "Delivered");
    if (i >= 0) rail[i] = { label: "Delivered — confirm receipt", date: short, state: "cur" };
    await db
      .update(schema.orders)
      .set({ status: "confirm-receipt", statusLabel: "Confirm receipt", rail, deliveredOn: date })
      .where(eq(schema.orders.id, orderId));
  }
  await audit(s.userId, "order.advance", "order", orderId, { to: next.status });
}

/* ---------- requirements (Workflow C) ---------- */

export async function requirementsForAdmin(): Promise<AdminRequirementRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.requirements).orderBy(desc(schema.requirements.id));
  const quotes = await db
    .select({ reqId: schema.quotations.reqId })
    .from(schema.quotations);
  const quoteCount = new Map<string, number>();
  for (const q of quotes) quoteCount.set(q.reqId, (quoteCount.get(q.reqId) ?? 0) + 1);
  return rows.map((x) => ({
    id: x.id, title: x.title, catSlug: x.catSlug, qty: x.qty,
    destination: x.destination as AdminRequirementRow["destination"],
    published: x.published, closes: x.closes,
    status: x.status, statusLabel: x.statusLabel,
    quoteCount: quoteCount.get(x.id) ?? 0,
    poId: x.poId,
    items: x.items ?? null,
  }));
}

export async function requirementForAdmin(id: string): Promise<AdminRequirementDetail | null> {
  if (!(await adminSession())) return null;
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, id));
  if (!req) return null;
  const quotations = await db
    .select()
    .from(schema.quotations)
    .where(eq(schema.quotations.reqId, id))
    .orderBy(asc(schema.quotations.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const quotes: AdminQuoteView[] = [];
  for (const q of quotations) {
    const versions = await db
      .select()
      .from(schema.quotationVersions)
      .where(eq(schema.quotationVersions.quotationId, q.id))
      .orderBy(desc(schema.quotationVersions.v));
    const msgs = await db
      .select()
      .from(schema.negotiationMessages)
      .where(eq(schema.negotiationMessages.quotationId, q.id))
      .orderBy(asc(schema.negotiationMessages.id));
    quotes.push({
      quotationId: q.id,
      supplierOrgId: q.supplierOrgId,
      supplierName: orgName.get(q.supplierOrgId) ?? "",
      status: q.status, statusLabel: q.statusLabel,
      versions: versions.map((v, i) => ({
        v: v.v, unit: r(v.unitPaise), quantity: v.quantity, lead: v.lead,
        validTill: v.validTill, terms: v.terms, date: v.date, current: i === 0,
        items: v.items?.map((it) => ({ title: it.title, catSlug: it.catSlug, qty: it.qty, unit: r(it.unitPaise) })),
        total: v.items ? r(v.totalPaise) : undefined,
      })),
      // supplier-side rows store "you" for the supplier's own messages
      messages: msgs.map((m) => ({
        from: (m.fromRole === "you" ? "supplier" : m.fromRole) as "smash pro" | "supplier" | "system",
        meta: m.meta, body: m.body,
      })),
    });
  }
  return {
    id: req.id, title: req.title, catSlug: req.catSlug, qty: req.qty,
    destination: req.destination as AdminRequirementRow["destination"],
    published: req.published, closes: req.closes,
    status: req.status, statusLabel: req.statusLabel,
    quoteCount: quotes.length,
    poId: req.poId,
    items: req.items ?? null,
    spec: req.spec, requiredBy: req.requiredBy,
    quotes,
  };
}

export async function createRequirement(input: {
  items: { title: string; catSlug: string; qty: string }[];
  destination: string; closes: string;
  requiredBy?: string; spec?: [string, string][]; fromProductRequestId?: string;
}): Promise<{ id: string }> {
  const s = await requireAdmin();
  const closes = input.closes.trim();
  const requiredBy = input.requiredBy?.trim() || null;
  if (!closes || closes.length > 120) throw new Error("400:A closing time up to 120 characters is required");
  if (requiredBy && requiredBy.length > 120) throw new Error("400:required-by is too long");
  if (input.destination !== "warehouse" && input.destination !== "direct") {
    throw new Error("400:Destination must be warehouse or direct");
  }
  const items = (input.items ?? []).map((it) => ({
    title: (it.title ?? "").trim(), catSlug: it.catSlug, qty: (it.qty ?? "").trim(),
  }));
  if (items.length === 0 || items.length > 20) {
    throw new Error("400:A requirement needs 1 to 20 product lines");
  }
  for (const it of items) {
    if (!it.title || it.title.length > 200) throw new Error("400:Each product title up to 200 characters is required");
    if (!it.qty || it.qty.length > 120) throw new Error("400:Each product quantity up to 120 characters is required");
  }
  const spec = input.spec ?? null;
  if (spec) assertSpecs(spec);
  const catSlugs = [...new Set(items.map((it) => it.catSlug))];
  const cats = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(inArray(schema.categories.slug, catSlugs));
  if (cats.length !== catSlugs.length) throw new Error("400:Unknown category");

  let fromRequest: typeof schema.productRequests.$inferSelect | undefined;
  if (input.fromProductRequestId) {
    [fromRequest] = await db
      .select()
      .from(schema.productRequests)
      .where(eq(schema.productRequests.id, input.fromProductRequestId));
    if (!fromRequest) throw new Error("400:Unknown product request");
  }

  // title/catSlug/qty stay a derived summary so every existing list/filter
  // keeps working unchanged — `items` (when >1) is the source of truth
  const title = items.length === 1 ? items[0].title : `${items[0].title} + ${items.length - 1} more`;
  const qty = items.length === 1 ? items[0].qty : `${items.length} products`;

  const rows = await db.select({ id: schema.requirements.id }).from(schema.requirements);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-4)) || 0), 0);
  const id = `REQ-2026-${String(max + 1).padStart(4, "0")}`;
  await db.insert(schema.requirements).values({
    id, title, catSlug: items[0].catSlug, qty,
    destination: input.destination,
    published: fullDate(), closes,
    status: "open", statusLabel: "Open · not quoted",
    spec, requiredBy,
    items: items.length > 1 ? items : null,
  });
  if (fromRequest) {
    // keep the originating buyer request in sourcing review and record linkage
    await db
      .update(schema.productRequests)
      .set({ status: "in-review", statusLabel: "In sourcing review" })
      .where(eq(schema.productRequests.id, fromRequest.id));
  }
  await audit(s.userId, "requirement.create", "requirement", id,
    fromRequest ? { fromProductRequestId: fromRequest.id } : undefined);
  return { id };
}

/* ---------- quotations (Workflows E/F) ---------- */

async function latestVersion(quotationId: number) {
  const [v] = await db
    .select()
    .from(schema.quotationVersions)
    .where(eq(schema.quotationVersions.quotationId, quotationId))
    .orderBy(desc(schema.quotationVersions.v))
    .limit(1);
  return v;
}

export async function sendQuoteMessage(quotationId: number, text: string) {
  const s = await requireAdmin();
  const body = text.trim();
  if (!body || body.length > 4000) throw new Error("400:A message up to 4000 characters is required");
  const [q] = await db.select().from(schema.quotations).where(eq(schema.quotations.id, quotationId));
  if (!q) throw new Error("404");
  const v = await latestVersion(q.id);
  const meta =
    `SMASH PRO · ${fullDate()}, ${timeOfDay()}` + (v ? ` · re: v${v.v}` : "");
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "smash pro", meta, body,
  });
  await audit(s.userId, "negotiation.message", "quotation", String(q.id));
}

export async function requestQuoteRevision(quotationId: number, note: string) {
  const s = await requireAdmin();
  const body = note.trim();
  if (!body || body.length > 2000) throw new Error("400:A revision note up to 2000 characters is required");
  const [q] = await db.select().from(schema.quotations).where(eq(schema.quotations.id, quotationId));
  if (!q) throw new Error("404");
  if (q.status !== "submitted") throw new Error("409");
  const v = await latestVersion(q.id);
  const vRef = v ? ` · re: v${v.v}` : "";
  await db
    .update(schema.quotations)
    .set({ status: "revision-requested", statusLabel: "Revision requested" })
    .where(eq(schema.quotations.id, q.id));
  await db
    .update(schema.requirements)
    .set({ status: "quoted-revision", statusLabel: "Quoted · revision requested" })
    .where(eq(schema.requirements.id, q.reqId));
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "system", meta: "",
    body: `Smash Pro requested a revision · ${fullDate()}, ${timeOfDay()}${vRef}`,
  });
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "smash pro",
    meta: `SMASH PRO · ${fullDate()}, ${timeOfDay()}${vRef}`,
    body,
  });
  await audit(s.userId, "quotation.request-revision", "quotation", String(q.id));
}

export async function awardQuotation(quotationId: number) {
  const s = await requireAdmin();
  const [q] = await db.select().from(schema.quotations).where(eq(schema.quotations.id, quotationId));
  if (!q) throw new Error("404");
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, q.reqId));
  if (!req) throw new Error("404");
  if (req.status !== "open" && req.status !== "quoted-revision") throw new Error("409");
  await db
    .update(schema.quotations)
    .set({ status: "awarded", statusLabel: "Awarded" })
    .where(eq(schema.quotations.id, q.id));
  await db
    .update(schema.quotations)
    .set({ status: "closed", statusLabel: "Not selected" })
    .where(and(eq(schema.quotations.reqId, q.reqId), ne(schema.quotations.id, q.id)));
  // statusLabel is the supplier-view string (schema note) — hence "to you"
  await db
    .update(schema.requirements)
    .set({ status: "awarded", statusLabel: "Awarded to you" })
    .where(eq(schema.requirements.id, q.reqId));
  await audit(s.userId, "quotation.award", "quotation", String(q.id), { reqId: q.reqId });
}

/* ---------- purchase orders (Workflow G / OBD-19) ---------- */

export async function posForAdmin(): Promise<AdminPoRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db
    .select()
    .from(schema.purchaseOrders)
    .orderBy(desc(schema.purchaseOrders.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  // brand + MRP resolve PO → linked SKU → product; never entered per-PO.
  // Discount-vs-MRP is DERIVED (unit price vs the linked product's own
  // MRP) — there is no supplier-negotiated-discount field anywhere in the
  // quotation/PO model, so nothing here is a fabricated number.
  const prods = await db
    .select({ sku: schema.products.sku, brandId: schema.products.brandId, mrpPaise: schema.products.mrpPaise })
    .from(schema.products);
  const brands = await db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands);
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  const bySku = new Map(prods.map((p) => [p.sku, p]));
  const allInvoices = await db
    .select({ id: schema.invoices.id, poIds: schema.invoices.poIds })
    .from(schema.invoices);
  const invoiceByPo = new Map<string, string>();
  for (const inv of allInvoices) for (const poId of inv.poIds) invoiceByPo.set(poId, inv.id);
  return rows.map((p) => {
    const linked = p.sku ? bySku.get(p.sku) : undefined;
    const mrpPaise = linked?.mrpPaise ?? null;
    return {
      id: p.id,
      supplierOrgId: p.supplierOrgId,
      supplierName: orgName.get(p.supplierOrgId) ?? "",
      reqId: p.reqId ?? null,
      destination: p.destination as AdminPoRow["destination"],
      issued: p.issued,
      lineName: p.lineName,
      sku: p.sku ?? null,
      brand: linked?.brandId != null ? brandName.get(linked.brandId) ?? null : null,
      lineQty: p.lineQty,
      unit: r(p.unitPaise), value: r(p.valuePaise),
      mrp: mrpPaise !== null ? r(mrpPaise) : null,
      discountVsMrpPct: mrpPaise !== null ? visitorDiscountPct(mrpPaise, p.unitPaise) : null,
      fulfilment: p.fulfilment as AdminPoRow["fulfilment"],
      fulfilmentLabel: p.fulfilmentLabel,
      received: r(p.receivedPaise), outstanding: r(p.outstandingPaise),
      payStatusLabel: p.payStatusLabel,
      nextFulfilment: nextPoFulfilment(p),
      invoiceId: invoiceByPo.get(p.id) ?? null,
    };
  });
}

/** Issue a PO from an awarded quotation's latest version. Destination is
 *  admin-set (OBD-19 Option C — the supplier never chooses). */
export async function createPo(input: {
  quotationId: number; destination: string; sku?: string | null;
  /** one optional catalogue SKU per line item, aligned by index — only
   *  meaningful when the awarded quotation is itemized (multi-product) */
  itemSkus?: (string | null)[];
}): Promise<{ id: string }> {
  const s = await requireAdmin();
  if (input.destination !== "warehouse" && input.destination !== "direct") {
    throw new Error("400:Destination must be warehouse or direct");
  }
  const [q] = await db
    .select()
    .from(schema.quotations)
    .where(eq(schema.quotations.id, input.quotationId));
  if (!q) throw new Error("404");
  if (q.status !== "awarded") throw new Error("409");
  const [existing] = await db
    .select({ id: schema.purchaseOrders.id })
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.quotationId, q.id));
  if (existing) throw new Error("409");
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, q.reqId));
  if (!req) throw new Error("404");
  const v = await latestVersion(q.id);
  if (!v) throw new Error("409");

  // optional — links a PO line to a catalogue product so Brand resolves
  // automatically; does not change pricing (that stays the quotation's own)
  async function resolveSku(raw: string | null | undefined): Promise<string | null> {
    if (!raw) return null;
    const [p] = await db.select({ sku: schema.products.sku }).from(schema.products).where(eq(schema.products.sku, raw));
    if (!p) throw new Error("400:Unknown product SKU");
    return p.sku;
  }

  // a multi-product award issues one PO row per line item; a single-product
  // award issues exactly one, same as before
  const lines = v.items && v.items.length > 0
    ? v.items.map((it, i) => ({
        lineName: it.title, lineQty: parseLeadingInt(it.qty) ?? 0,
        unitPaise: it.unitPaise, skuRaw: input.itemSkus?.[i] ?? null,
      }))
    : [{
        lineName: req.title, lineQty: parseLeadingInt(v.quantity) ?? parseLeadingInt(req.qty) ?? 0,
        unitPaise: v.unitPaise, skuRaw: input.sku ?? null,
      }];

  const rows = await db.select({ id: schema.purchaseOrders.id }).from(schema.purchaseOrders);
  let max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-5)) || 0), 0);
  const issued = fullDate();
  const poIds: string[] = [];

  for (const line of lines) {
    if (!line.lineQty) {
      throw new Error("400:Could not determine the PO quantity from the quotation or requirement");
    }
    const valuePaise = line.unitPaise * line.lineQty;
    // integer-paise storage bound (technical, not a business rule)
    if (valuePaise > 1_900_000_000) {
      throw new Error("400:PO value is too large to process in one PO — please split it");
    }
    const sku = await resolveSku(line.skuRaw);
    max += 1;
    const id = `PO-2026-${String(max).padStart(5, "0")}`;
    poIds.push(id);
    await db.insert(schema.purchaseOrders).values({
      id, supplierOrgId: q.supplierOrgId, quotationId: q.id, reqId: q.reqId,
      destination: input.destination, issued,
      lineName: line.lineName, sku, lineQty: line.lineQty,
      unitPaise: line.unitPaise, valuePaise,
      // PO contract: a PO is issued in the `issued` state awaiting supplier
      // acknowledgement — the admin never short-circuits that step
      fulfilment: "issued", fulfilmentLabel: "Issued · awaiting acknowledgement",
      acknowledgedAt: null,
      dispatchBy: v.lead,
      dispatchedQty: `0 of ${line.lineQty}`, receivedQty: `0 of ${line.lineQty}`,
      awardedFrom: { reqId: q.reqId, version: `v${v.v}` },
      terms: { unit: r(line.unitPaise), qty: line.lineQty, lead: v.lead, validTill: v.validTill, payment: v.terms },
      paymentTerms: v.terms,
      receivedPaise: 0, outstandingPaise: valuePaise,
      payStatusLabel: /adv/i.test(v.terms) ? "Advance pending" : "As quoted",
      minDeliveryInfo: null, shipment: null,
    });
  }
  await db
    .update(schema.requirements)
    .set({ poId: poIds[0] })
    .where(eq(schema.requirements.id, q.reqId));
  await audit(s.userId, "po.create", "purchase_order", poIds.join(","), {
    quotationId: q.id, reqId: q.reqId, destination: input.destination, poIds,
  });
  return { id: poIds[0] };
}

export async function advancePo(poId: string) {
  const s = await requireAdmin();
  const [p] = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, poId));
  if (!p) throw new Error("404");
  const next = nextPoFulfilment(p);
  if (!next) throw new Error("409");
  await db
    .update(schema.purchaseOrders)
    .set({
      fulfilment: next.fulfilment,
      fulfilmentLabel: next.label,
      ...(next.fulfilment === "closed" && p.destination === "warehouse"
        ? { receivedQty: String(p.lineQty) }
        : {}),
    })
    .where(eq(schema.purchaseOrders.id, poId));
  await audit(s.userId, "po.advance", "purchase_order", poId, { to: next.fulfilment });
}

export async function recordPoPayment(poId: string, amount: number, title?: string) {
  const s = await requireAdmin();
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("400:Amount must be a positive amount in rupees");
  }
  const recordTitle = title?.trim() || `Payment — ${poId}`;
  if (recordTitle.length > 200) throw new Error("400:Title is too long");
  const [p] = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, poId));
  if (!p) throw new Error("404");
  const amountPaise = Math.round(amount * 100);
  if (amountPaise <= 0) throw new Error("400:Amount must be at least ₹0.01");
  if (amountPaise > p.outstandingPaise) {
    throw new Error("400:Amount must not exceed the outstanding balance");
  }
  const outstandingPaise = p.outstandingPaise - amountPaise;
  await db
    .update(schema.purchaseOrders)
    .set({
      receivedPaise: p.receivedPaise + amountPaise,
      outstandingPaise,
      payStatusLabel: outstandingPaise === 0 ? "Paid in full" : "Balance due",
    })
    .where(eq(schema.purchaseOrders.id, poId));
  await db.insert(schema.supplierPaymentRecords).values({
    supplierOrgId: p.supplierOrgId,
    title: recordTitle,
    meta: `${rupees(r(amountPaise))} · ${fullDate()}`,
  });
  await audit(s.userId, "po.record-payment", "purchase_order", poId, { amount: r(amountPaise) });
}

/* ---------- invoices (supplier → Smash Pro, recorded against a PO award) ----------
   A supplier's tax invoice for goods received, transcribed into the app in
   the structure of a standard GST tax invoice. This is RECORD-KEEPING only:
   every GST/HSN figure is admin-entered (as the supplier's own invoice
   states it) and the CGST+SGST vs IGST split is a structural same-state /
   different-state check — never a computed or asserted tax position. Still
   pending OBD-11/OBD-20 professional tax validation, same as every other
   GST-adjacent field in this app. */

export async function invoiceablePosForRequirement(reqId: string): Promise<{
  reqTitle: string; supplierOrgId: number; supplierName: string; supplierGstin: string;
  pos: AdminInvoiceablePo[];
} | null> {
  if (!(await adminSession())) return null;
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, reqId));
  if (!req) return null;
  const poRows = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.reqId, reqId));
  if (poRows.length === 0) return null;
  const already = await db
    .select({ poIds: schema.invoices.poIds })
    .from(schema.invoices)
    .where(eq(schema.invoices.reqId, reqId));
  const invoiced = new Set(already.flatMap((a) => a.poIds));
  const [org] = await db
    .select({ name: schema.organizations.name, gstin: schema.organizations.gstin })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, poRows[0].supplierOrgId));
  return {
    reqTitle: req.title,
    supplierOrgId: poRows[0].supplierOrgId,
    supplierName: org?.name ?? "",
    supplierGstin: org?.gstin ?? "",
    pos: poRows
      .filter((p) => !invoiced.has(p.id))
      .map((p) => ({
        id: p.id, lineName: p.lineName, sku: p.sku ?? null, lineQty: p.lineQty,
        unit: r(p.unitPaise), value: r(p.valuePaise),
      })),
  };
}

export async function createInvoice(input: {
  reqId: string;
  supplierInvoiceNo: string; supplierInvoiceDate: string;
  placeOfSupply: string; transportMode: string; paymentTerms: string;
  taxMode: "intra" | "inter";
  lines: {
    poId: string; description?: string; hsn?: string | null; qty: number; uom: string;
    rate: number; disc?: number; gstPercent?: number | null;
  }[];
}): Promise<{ id: string }> {
  const s = await requireAdmin();
  if (input.taxMode !== "intra" && input.taxMode !== "inter") {
    throw new Error("400:Tax mode must be intra-state or inter-state");
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error("400:Select at least one purchase order line");
  }
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, input.reqId));
  if (!req) throw new Error("404");
  const poIds = input.lines.map((l) => l.poId);
  const poRows = await db.select().from(schema.purchaseOrders).where(inArray(schema.purchaseOrders.id, poIds));
  if (poRows.length !== poIds.length) throw new Error("400:Unknown purchase order line");
  const supplierOrgId = poRows[0].supplierOrgId;
  if (poRows.some((p) => p.supplierOrgId !== supplierOrgId)) {
    throw new Error("400:All lines on one invoice must share one supplier");
  }
  const already = await db
    .select({ poIds: schema.invoices.poIds })
    .from(schema.invoices)
    .where(eq(schema.invoices.reqId, input.reqId));
  const invoicedSet = new Set(already.flatMap((a) => a.poIds));
  if (poIds.some((id) => invoicedSet.has(id))) throw new Error("409");

  const supplierInvoiceNo = input.supplierInvoiceNo.trim();
  if (!supplierInvoiceNo || supplierInvoiceNo.length > 60) {
    throw new Error("400:The supplier's invoice number is required");
  }
  const supplierInvoiceDate = input.supplierInvoiceDate.trim();
  if (!supplierInvoiceDate || supplierInvoiceDate.length > 60) {
    throw new Error("400:The supplier's invoice date is required");
  }

  const lines = input.lines.map((ln) => {
    const po = poRows.find((p) => p.id === ln.poId);
    if (!po) throw new Error("400:Line does not match a selected purchase order");
    const qty = ln.qty;
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("400:Quantity must be positive");
    const ratePaise = Math.round(ln.rate * 100);
    if (!Number.isFinite(ratePaise) || ratePaise < 0) throw new Error("400:Rate must be zero or more");
    const discPaise = Math.round((ln.disc ?? 0) * 100);
    if (!Number.isFinite(discPaise) || discPaise < 0) throw new Error("400:Discount must be zero or more");
    const hsn = normalizeHsn(ln.hsn ?? null) ?? "";
    const gstPercent = normalizeGstPercent(ln.gstPercent ?? null) ?? 0;
    const uom = (ln.uom || "Pcs").trim().slice(0, 20);
    const description = (ln.description || po.lineName).trim().slice(0, 300);
    const taxableValuePaise = Math.max(0, ratePaise * qty - discPaise);
    const taxPaise = Math.round((taxableValuePaise * gstPercent) / 100);
    const cgstPaise = input.taxMode === "intra" ? Math.round(taxPaise / 2) : 0;
    const sgstPaise = input.taxMode === "intra" ? taxPaise - cgstPaise : 0;
    const igstPaise = input.taxMode === "inter" ? taxPaise : 0;
    return {
      poId: po.id, description, hsn, qty, uom,
      ratePaise, discPaise, taxableValuePaise, gstPercent, cgstPaise, sgstPaise, igstPaise,
    };
  });

  const taxableTotalPaise = lines.reduce((sum, l) => sum + l.taxableValuePaise, 0);
  const cgstTotalPaise = lines.reduce((sum, l) => sum + l.cgstPaise, 0);
  const sgstTotalPaise = lines.reduce((sum, l) => sum + l.sgstPaise, 0);
  const igstTotalPaise = lines.reduce((sum, l) => sum + l.igstPaise, 0);
  const rawTotalPaise = taxableTotalPaise + cgstTotalPaise + sgstTotalPaise + igstTotalPaise;
  const grandTotalPaise = Math.round(rawTotalPaise / 100) * 100;
  const roundOffPaise = grandTotalPaise - rawTotalPaise;

  const rows = await db.select({ id: schema.invoices.id }).from(schema.invoices);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-5)) || 0), 0);
  const id = `INV-2026-${String(max + 1).padStart(5, "0")}`;
  await db.insert(schema.invoices).values({
    id, reqId: input.reqId, quotationId: poRows[0].quotationId ?? null, supplierOrgId,
    poIds, status: "draft",
    supplierInvoiceNo, supplierInvoiceDate,
    placeOfSupply: input.placeOfSupply.trim().slice(0, 120),
    transportMode: input.transportMode.trim().slice(0, 120),
    paymentTerms: input.paymentTerms.trim().slice(0, 120),
    taxMode: input.taxMode, lines,
    taxableTotalPaise, cgstTotalPaise, sgstTotalPaise, igstTotalPaise,
    roundOffPaise, grandTotalPaise,
    createdAt: fullDate(),
  });
  await audit(s.userId, "invoice.create", "invoice", id, { reqId: input.reqId, poIds });
  return { id };
}

export async function invoicesForAdmin(): Promise<AdminInvoiceRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const reqs = await db.select({ id: schema.requirements.id, title: schema.requirements.title }).from(schema.requirements);
  const reqTitle = new Map(reqs.map((rr) => [rr.id, rr.title]));
  return rows.map((x) => ({
    id: x.id, reqId: x.reqId, reqTitle: reqTitle.get(x.reqId) ?? x.reqId,
    supplierOrgId: x.supplierOrgId, supplierName: orgName.get(x.supplierOrgId) ?? "",
    poIds: x.poIds, status: x.status as "draft" | "sent",
    supplierInvoiceNo: x.supplierInvoiceNo, supplierInvoiceDate: x.supplierInvoiceDate,
    grandTotal: r(x.grandTotalPaise), createdAt: x.createdAt, sentAt: x.sentAt,
  }));
}

export async function invoiceForAdmin(id: string): Promise<AdminInvoiceDetail | null> {
  if (!(await adminSession())) return null;
  const [x] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
  if (!x) return null;
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, x.supplierOrgId));
  const [req] = await db
    .select({ title: schema.requirements.title })
    .from(schema.requirements)
    .where(eq(schema.requirements.id, x.reqId));
  return {
    id: x.id, reqId: x.reqId, reqTitle: req?.title ?? x.reqId,
    supplierOrgId: x.supplierOrgId, supplierName: org?.name ?? "",
    poIds: x.poIds, status: x.status as "draft" | "sent",
    supplierInvoiceNo: x.supplierInvoiceNo, supplierInvoiceDate: x.supplierInvoiceDate,
    grandTotal: r(x.grandTotalPaise), createdAt: x.createdAt, sentAt: x.sentAt,
    placeOfSupply: x.placeOfSupply, transportMode: x.transportMode, paymentTerms: x.paymentTerms,
    taxMode: x.taxMode as "intra" | "inter",
    lines: x.lines.map((l) => ({
      poId: l.poId, description: l.description, hsn: l.hsn, qty: l.qty, uom: l.uom,
      rate: r(l.ratePaise), disc: r(l.discPaise), taxableValue: r(l.taxableValuePaise),
      gstPercent: l.gstPercent, cgst: r(l.cgstPaise), sgst: r(l.sgstPaise), igst: r(l.igstPaise),
    })),
    taxableTotal: r(x.taxableTotalPaise), cgstTotal: r(x.cgstTotalPaise), sgstTotal: r(x.sgstTotalPaise),
    igstTotal: r(x.igstTotalPaise), roundOff: r(x.roundOffPaise),
    seller: {
      legalName: org?.legalName || org?.name || "", address: org?.worksAddress ?? "",
      gstin: org?.gstin ?? "", phone: org?.contactPhone ?? "", email: org?.email ?? "",
    },
    buyer: {
      legalName: SMASH_PRO_PROFILE.legalName, address: SMASH_PRO_PROFILE.address,
      gstin: SMASH_PRO_PROFILE.gstin, pan: SMASH_PRO_PROFILE.pan,
    },
  };
}

export async function markInvoiceSent(id: string): Promise<void> {
  const s = await requireAdmin();
  const [x] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
  if (!x) throw new Error("404");
  if (x.status !== "draft") throw new Error("409");
  await db.update(schema.invoices).set({ status: "sent", sentAt: fullDate() }).where(eq(schema.invoices.id, id));
  await audit(s.userId, "invoice.send", "invoice", id);
}

/* ---------- complaints ---------- */

export async function complaintsForAdmin(): Promise<AdminComplaintRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.complaints).orderBy(desc(schema.complaints.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return rows.map((c) => ({
    id: c.id, orderId: c.orderId,
    orgName: orgName.get(c.orgId) ?? "",
    body: c.body,
    status: c.status as AdminComplaintRow["status"],
    created: fullDate(c.createdAt),
  }));
}

/** Resolution workflow beyond open/resolved stays PENDING CONFIRMATION —
 *  no resolution categories, notes or SLAs are invented here. */
export async function resolveComplaint(id: number) {
  const s = await requireAdmin();
  const [c] = await db.select().from(schema.complaints).where(eq(schema.complaints.id, id));
  if (!c) throw new Error("404");
  if (c.status !== "open") throw new Error("409");
  await db.update(schema.complaints).set({ status: "resolved" }).where(eq(schema.complaints.id, id));
  await audit(s.userId, "complaint.resolve", "complaint", String(id), { orderId: c.orderId });
}

/* ---------- site content (ADR-0021 — website images/content) ---------- */

export async function siteContentForAdmin(): Promise<AdminSiteContent | null> {
  if (!(await adminSession())) return null;
  const rows = await db.select().from(schema.siteContent).orderBy(asc(schema.siteContent.sortOrder));
  const cats = await db
    .select({ slug: schema.categories.slug, name: schema.categories.name })
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));

  const heroSlides = rows
    .filter((r) => r.section === "hero-slide")
    .map((r) => ({
      id: r.id, sortOrder: r.sortOrder, active: r.active,
      img: r.img ?? "", imgPosition: r.imgPosition ?? "center",
      eyebrow: r.eyebrow ?? "", titleA: r.titleA ?? "", accent: r.accent ?? "", titleB: r.titleB ?? "",
      body: r.body ?? "", ctaLabel: r.ctaLabel ?? "", ctaHref: r.ctaHref ?? "",
      institutional: r.institutional,
    }));

  const heroBySlug = new Map(rows.filter((r) => r.section === "category-hero" && r.catSlug).map((r) => [r.catSlug!, r]));
  const introBySlug = new Map(rows.filter((r) => r.section === "category-intro" && r.catSlug).map((r) => [r.catSlug!, r]));
  const categoryHero = cats.map((c) => ({ slug: c.slug, label: c.name, img: heroBySlug.get(c.slug)?.img ?? "" }));
  const categoryIntro = cats.map((c) => ({ slug: c.slug, label: c.name, body: introBySlug.get(c.slug)?.body ?? "" }));

  return { heroSlides, categoryHero, categoryIntro };
}

function assertSiteContentFields(input: {
  eyebrow?: string; titleA?: string; accent?: string; titleB?: string; body?: string;
  ctaLabel?: string; ctaHref?: string;
}) {
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v.length > 300) throw new Error(`400:${k} is too long`);
  }
}

export async function upsertHeroSlide(input: {
  id?: string;
  img: string; imgPosition?: string; eyebrow: string; titleA: string; accent: string; titleB: string;
  body: string; ctaLabel: string; ctaHref: string; institutional?: boolean; active?: boolean; sortOrder?: number;
}) {
  const s = await requireAdmin();
  const img = assertImgPath(input.img);
  assertSiteContentFields(input);
  if (!input.ctaHref.startsWith("/")) throw new Error("400:CTA link must be an internal path starting with /");

  const id = input.id ?? `hero-${Date.now()}`;
  const values = {
    id, section: "hero-slide" as const, sortOrder: input.sortOrder ?? 0, active: input.active ?? true,
    img, imgPosition: input.imgPosition || "center",
    eyebrow: input.eyebrow.trim(), titleA: input.titleA.trim(), accent: input.accent.trim(), titleB: input.titleB.trim(),
    body: input.body.trim(), ctaLabel: input.ctaLabel.trim(), ctaHref: input.ctaHref.trim(),
    institutional: input.institutional ?? false, updatedAt: new Date(),
  };
  if (input.id) {
    const [existing] = await db.select({ id: schema.siteContent.id }).from(schema.siteContent).where(eq(schema.siteContent.id, input.id));
    if (!existing) throw new Error("404");
    await db.update(schema.siteContent).set(values).where(eq(schema.siteContent.id, input.id));
  } else {
    await db.insert(schema.siteContent).values(values);
  }
  await audit(s.userId, "site-content.hero-slide.upsert", "site_content", id, { new: !input.id });
  return { id };
}

export async function deleteHeroSlide(id: string) {
  const s = await requireAdmin();
  const [row] = await db.select({ id: schema.siteContent.id }).from(schema.siteContent)
    .where(and(eq(schema.siteContent.id, id), eq(schema.siteContent.section, "hero-slide")));
  if (!row) throw new Error("404");
  await db.delete(schema.siteContent).where(eq(schema.siteContent.id, id));
  await audit(s.userId, "site-content.hero-slide.delete", "site_content", id);
}

async function upsertCategoryContent(section: "category-hero" | "category-intro", slug: string, patch: { img?: string; body?: string }) {
  const s = await requireAdmin();
  const [cat] = await db.select({ slug: schema.categories.slug }).from(schema.categories).where(eq(schema.categories.slug, slug));
  if (!cat) throw new Error("400:Unknown category");
  const id = `${section}-${slug}`;
  const [existing] = await db.select({ id: schema.siteContent.id }).from(schema.siteContent).where(eq(schema.siteContent.id, id));
  const img = patch.img !== undefined ? (patch.img.trim() ? assertImgPath(patch.img) : "") : undefined;
  const body = patch.body !== undefined ? patch.body.trim().slice(0, 500) : undefined;
  if (existing) {
    await db.update(schema.siteContent).set({ img, body, updatedAt: new Date() }).where(eq(schema.siteContent.id, id));
  } else {
    await db.insert(schema.siteContent).values({ id, section, catSlug: slug, img: img ?? null, body: body ?? null });
  }
  await audit(s.userId, `site-content.${section}.set`, "site_content", id, patch);
}

export async function setCategoryHero(slug: string, img: string) {
  return upsertCategoryContent("category-hero", slug, { img });
}

export async function setCategoryIntro(slug: string, body: string) {
  if (!body.trim()) throw new Error("400:Description can't be empty");
  return upsertCategoryContent("category-intro", slug, { body });
}

/* ---------- service requests (ADR-0020 — equipment Care/Repair) ---------- */

export async function serviceRequestsForAdmin(): Promise<AdminServiceRequestRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.serviceRequests).orderBy(desc(schema.serviceRequests.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return rows.map((x) => ({
    id: x.id,
    orgName: x.orgId !== null ? orgName.get(x.orgId) ?? null : null,
    contactName: x.contactName, contactPhone: x.contactPhone, contactEmail: x.contactEmail,
    kind: x.kind as "care" | "repair", sport: x.sport as "cricket" | "badminton",
    services: x.services, equipmentSource: x.equipmentSource as "new" | "own",
    brand: x.brand, model: x.model, description: x.description,
    photos: x.photos, voiceNoteUrl: x.voiceNoteUrl,
    status: x.status as AdminServiceRequestRow["status"], statusLabel: x.statusLabel,
    quoted: x.quotedPaise !== null ? r(x.quotedPaise) : null,
    adminNote: x.adminNote,
    submitted: fullDate(x.submittedAt),
  }));
}

const SERVICE_STATUS_LABEL: Record<string, string> = {
  new: "New", quoted: "Quoted", approved: "Approved", "in-progress": "In progress",
  completed: "Completed", declined: "Declined", cancelled: "Cancelled",
};

/** Admin sets a quotation and/or moves status forward. Status transitions
 *  are deliberately loose (no state machine) — this is a manually-run
 *  service queue, not a priced checkout flow (pricing stays admin-entered,
 *  PENDING CONFIRMATION on anything beyond that). */
export async function updateServiceRequest(
  id: string,
  patch: { status?: string; quoted?: number; adminNote?: string }
) {
  const s = await requireAdmin();
  const [row] = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, id));
  if (!row) throw new Error("404");
  const set: { status?: string; statusLabel?: string; quotedPaise?: number | null; adminNote?: string | null } = {};
  if (patch.status !== undefined) {
    if (!SERVICE_STATUS_LABEL[patch.status]) throw new Error("400:Unknown status");
    set.status = patch.status;
    set.statusLabel = SERVICE_STATUS_LABEL[patch.status];
  }
  if (patch.quoted !== undefined) {
    if (typeof patch.quoted !== "number" || !Number.isFinite(patch.quoted) || patch.quoted < 0) {
      throw new Error("400:Quote must be a non-negative amount");
    }
    set.quotedPaise = Math.round(patch.quoted * 100);
  }
  if (patch.adminNote !== undefined) {
    const note = patch.adminNote.trim();
    if (note.length > 1000) throw new Error("400:Note is too long");
    set.adminNote = note || null;
  }
  if (Object.keys(set).length === 0) throw new Error("400:Nothing to update");
  await db.update(schema.serviceRequests).set(set).where(eq(schema.serviceRequests.id, id));
  await audit(s.userId, "service-request.update", "service_request", id, patch);
}

/* ---------- product requests (BUY-007 admin side) ---------- */

export async function productRequestsForAdmin(): Promise<AdminProductRequestRow[]> {
  if (!(await adminSession())) return [];
  const rows = await db.select().from(schema.productRequests).orderBy(desc(schema.productRequests.id));
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return rows.map((x) => ({
    id: x.id,
    orgName: orgName.get(x.orgId) ?? "",
    title: x.title, category: x.category, qty: x.qty,
    neededBy: x.neededBy, submitted: x.submitted,
    status: x.status as AdminProductRequestRow["status"],
    statusLabel: x.statusLabel,
    declineReason: x.declineReason,
  }));
}

/** Labels match the buyer-side strings exactly (src/data/buyer.ts). */
export async function setProductRequestStatus(
  id: string,
  status: "available" | "declined",
  declineReason?: string
) {
  const s = await requireAdmin();
  if (status !== "available" && status !== "declined") {
    throw new Error("400:Status must be available or declined");
  }
  const reason = declineReason?.trim() || null;
  if (status === "declined" && !reason) {
    throw new Error("400:A decline reason is required");
  }
  if (reason && reason.length > 1000) throw new Error("400:Decline reason is too long");
  const [x] = await db.select().from(schema.productRequests).where(eq(schema.productRequests.id, id));
  if (!x) throw new Error("404");
  await db
    .update(schema.productRequests)
    .set(
      status === "available"
        ? { status: "available", statusLabel: "Now available in catalogue", declineReason: null }
        : { status: "declined", statusLabel: "Declined", declineReason: reason }
    )
    .where(eq(schema.productRequests.id, id));
  await audit(s.userId, "product-request.status", "product_request", id,
    status === "declined" ? { status, reason } : { status });
}

/* ---------- report ---------- */

export async function reportForAdmin(): Promise<AdminReport | null> {
  if (!(await adminSession())) return null;
  const orders = await db
    .select({ id: schema.orders.id, statusLabel: schema.orders.statusLabel, totalPaise: schema.orders.totalPaise })
    .from(schema.orders);
  const pays = await db
    .select({ orderId: schema.payments.orderId, status: schema.payments.status })
    .from(schema.payments);
  const pos = await db
    .select({
      valuePaise: schema.purchaseOrders.valuePaise,
      outstandingPaise: schema.purchaseOrders.outstandingPaise,
      fulfilment: schema.purchaseOrders.fulfilment,
    })
    .from(schema.purchaseOrders);
  const orgs = await db
    .select({ kind: schema.organizations.kind, status: schema.organizations.status })
    .from(schema.organizations);
  const lines = await db
    .select({
      unitPaise: schema.orderLines.unitPaise,
      qty: schema.orderLines.qty,
      catSlug: schema.products.catSlug,
    })
    .from(schema.orderLines)
    .innerJoin(schema.products, eq(schema.orderLines.sku, schema.products.sku));
  const cats = await db.select().from(schema.categories);

  const byStatus = new Map<string, number>();
  for (const o of orders) byStatus.set(o.statusLabel, (byStatus.get(o.statusLabel) ?? 0) + 1);

  const payStatus = new Map(pays.map((p) => [p.orderId, p.status]));
  let confirmedTotal = 0;
  let awaitingTotal = 0;
  let awaitingCount = 0;
  for (const o of orders) {
    const st = payStatus.get(o.id);
    if (st === "confirmed") confirmedTotal += o.totalPaise;
    if (st === "awaiting-verification") {
      awaitingTotal += o.totalPaise;
      awaitingCount += 1;
    }
  }

  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  const catValue = new Map<string, number>();
  for (const l of lines) catValue.set(l.catSlug, (catValue.get(l.catSlug) ?? 0) + l.unitPaise * l.qty);

  return {
    orders: {
      count: orders.length,
      valueTotal: r(orders.reduce((sum, o) => sum + o.totalPaise, 0)),
      byStatus: [...byStatus.entries()].sort((a, b) => b[1] - a[1]),
    },
    payments: {
      confirmedTotal: r(confirmedTotal),
      awaitingTotal: r(awaitingTotal),
      awaitingCount,
    },
    procurement: {
      poValueTotal: r(pos.reduce((sum, p) => sum + p.valuePaise, 0)),
      outstandingToSuppliers: r(pos.reduce((sum, p) => sum + p.outstandingPaise, 0)),
      posOpen: pos.filter((p) => p.fulfilment !== "closed").length,
    },
    orgs: {
      buyersActive: orgs.filter((o) => o.kind === "buyer" && o.status === "active").length,
      suppliersActive: orgs.filter((o) => o.kind === "supplier" && o.status === "active").length,
      pending: orgs.filter((o) => o.status === "pending").length,
    },
    topCategories: [...catValue.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, paise]) => ({ slug, name: catName.get(slug) ?? slug, value: r(paise) })),
  };
}

/* ============================================================
   ENHANCEMENTS (B5+)
   ============================================================ */

const fmtDateTime = (d: Date) => `${fullDate(d)}, ${timeOfDay(d)}`;

/** Collapse an audit-detail jsonb into a short "k: v · k: v" string. */
function summariseDetail(detail: unknown): string | null {
  if (detail === null || detail === undefined) return null;
  if (typeof detail !== "object") return String(detail);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(detail as Record<string, unknown>)) {
    let val: string;
    if (v === null || v === undefined) val = "—";
    else if (Array.isArray(v)) val = v.map((x) => String(x)).join(", ");
    else if (typeof v === "object") val = JSON.stringify(v);
    else val = String(v);
    if (val.length > 80) val = `${val.slice(0, 80)}…`;
    parts.push(`${k}: ${val}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

/* ---------- 1 · audit log viewer (read-only) ---------- */

/** Recent audit rows joined to the actor, newest first. Optional filter by
 *  entity type and a case-insensitive substring match on entityId; paginated
 *  (default 100, hard cap 200 per page). The audit log is append-only — this
 *  is a read surface only, never an edit/delete path. */
export async function getAuditLog(filter?: {
  entity?: string; entityId?: string; limit?: number; offset?: number;
}): Promise<AuditLogPage> {
  // default page ~100 rows; hard cap keeps a single response bounded while
  // letting the page's "load more" grow the window
  const limit = Math.min(Math.max(filter?.limit ?? 100, 1), 1000);
  const offset = Math.max(filter?.offset ?? 0, 0);
  if (!(await adminSession())) return { rows: [], total: 0, limit, offset, entities: [] };

  const entity = filter?.entity?.trim() || null;
  const entityIdMatch = filter?.entityId?.trim().toLowerCase() || null;

  const rows = await db
    .select({
      id: schema.auditLog.id, action: schema.auditLog.action,
      entity: schema.auditLog.entity, entityId: schema.auditLog.entityId,
      detail: schema.auditLog.detail, at: schema.auditLog.at,
      actorEmail: schema.users.email, actorRole: schema.users.role,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.auditLog.actorUserId, schema.users.id))
    .orderBy(desc(schema.auditLog.id));

  const entities = [...new Set(rows.map((x) => x.entity))].sort();
  const filtered = rows.filter(
    (x) =>
      (!entity || x.entity === entity) &&
      (!entityIdMatch || x.entityId.toLowerCase().includes(entityIdMatch))
  );
  const page = filtered.slice(offset, offset + limit);
  return {
    rows: page.map(
      (x): AuditLogRow => ({
        id: x.id,
        actorEmail: x.actorEmail ?? null,
        actorRole: x.actorRole ?? null,
        action: x.action,
        entity: x.entity,
        entityId: x.entityId,
        detail: summariseDetail(x.detail),
        at: fmtDateTime(x.at),
      })
    ),
    total: filtered.length,
    limit, offset, entities,
  };
}

/* ---------- 2 · organization management (active/suspended) ---------- */

/** Every organization with kind/status and derived counts (buyer orders /
 *  supplier POs). Drives the management surface — distinct from the pending
 *  approvals queue, which stays in organizationsForAdmin(). */
export async function getOrganizationsFull(): Promise<AdminOrgFullRow[]> {
  if (!(await adminSession())) return [];
  const orgs = await db.select().from(schema.organizations).orderBy(desc(schema.organizations.id));
  const orders = await db
    .select({ orgId: schema.orders.orgId, totalPaise: schema.orders.totalPaise })
    .from(schema.orders);
  const pos = await db
    .select({ supplierOrgId: schema.purchaseOrders.supplierOrgId, valuePaise: schema.purchaseOrders.valuePaise })
    .from(schema.purchaseOrders);

  const orderCount = new Map<number, number>();
  const orderValue = new Map<number, number>();
  for (const o of orders) {
    orderCount.set(o.orgId, (orderCount.get(o.orgId) ?? 0) + 1);
    orderValue.set(o.orgId, (orderValue.get(o.orgId) ?? 0) + o.totalPaise);
  }
  const poCount = new Map<number, number>();
  const poValue = new Map<number, number>();
  for (const p of pos) {
    poCount.set(p.supplierOrgId, (poCount.get(p.supplierOrgId) ?? 0) + 1);
    poValue.set(p.supplierOrgId, (poValue.get(p.supplierOrgId) ?? 0) + p.valuePaise);
  }

  return orgs.map((o): AdminOrgFullRow => {
    const supplier = o.kind === "supplier";
    return {
      id: o.id,
      kind: o.kind as AdminOrgFullRow["kind"],
      status: o.status as AdminOrgFullRow["status"],
      name: o.name, orgType: o.orgType, city: o.city, gstin: o.gstin,
      contactName: o.contactName, email: o.email,
      directApproved: o.directApproved, submitted: fullDate(o.createdAt),
      orderCount: orderCount.get(o.id) ?? 0,
      poCount: poCount.get(o.id) ?? 0,
      totalValue: r(supplier ? (poValue.get(o.id) ?? 0) : (orderValue.get(o.id) ?? 0)),
    };
  });
}

/** Suspend an ACTIVE organization. Session role resolution gates buyers and
 *  suppliers on org status === "active" (auth.requireApproved / supplier's
 *  approvedSupplier), so a suspended org's users lose access immediately. */
export async function suspendOrganization(orgId: number, reason: string) {
  const s = await requireAdmin();
  const trimmed = reason.trim();
  if (!trimmed || trimmed.length > 1000) throw new Error("400:A suspension reason is required");
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (!org) throw new Error("404");
  if (org.status !== "active") throw new Error("409");
  await db.update(schema.organizations).set({ status: "suspended" }).where(eq(schema.organizations.id, orgId));
  await notifyOrg(
    orgId,
    `Your Smash Pro account has been suspended. Reason: ${trimmed}. Please contact the operations team.`
  );
  await audit(s.userId, "org.suspend", "organization", String(orgId), { reason: trimmed });
}

/** Reactivate a SUSPENDED organization — restores access. */
export async function reactivateOrganization(orgId: number) {
  const s = await requireAdmin();
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
  if (!org) throw new Error("404");
  if (org.status !== "suspended") throw new Error("409");
  await db.update(schema.organizations).set({ status: "active" }).where(eq(schema.organizations.id, orgId));
  await notifyOrg(orgId, "Your Smash Pro account has been reactivated. You can sign in and resume trading.");
  await audit(s.userId, "org.reactivate", "organization", String(orgId));
}

/* ---------- 3 · bulk catalogue & pricing operations ---------- */

/** Activate/deactivate many products in one operation. One audit entry
 *  records the affected count and SKUs. */
export async function bulkSetProductsActive(skus: string[], active: boolean): Promise<{ count: number }> {
  const s = await requireAdmin();
  if (typeof active !== "boolean") throw new Error("400:active must be true or false");
  if (!Array.isArray(skus) || skus.length === 0) throw new Error("400:Select at least one product");
  if (skus.length > 500) throw new Error("400:Too many products in one operation (max 500)");
  const norm = [...new Set(skus.map((x) => String(x).trim().toUpperCase()).filter(Boolean))];
  if (!norm.length) throw new Error("400:Select at least one product");
  const known = new Set(
    (await db.select({ sku: schema.products.sku }).from(schema.products)).map((x) => x.sku)
  );
  const valid = norm.filter((x) => known.has(x));
  if (!valid.length) throw new Error("400:None of the selected products were found");
  await db.update(schema.products).set({ active }).where(inArray(schema.products.sku, valid));
  await audit(s.userId, "product.bulk-active", "product", "bulk", {
    active, count: valid.length, skus: valid,
  });
  return { count: valid.length };
}

/** Bulk-sets category/subcategory/brand for many products at once — the
 *  fix for having to open the per-row Edit action one SKU at a time to
 *  correct these after a large Excel import (ADR-0017). Every other
 *  product-detail field (margin/price, HSN, MSP, colour, size, image)
 *  still goes through `updateProduct`; this covers just the three
 *  fields that most commonly need a one-shot correction across many
 *  imported rows. Same catSlug/sub/brandId validation as updateProduct,
 *  same 500-row cap/audit pattern as bulkSetProductsActive. */
export async function bulkUpdateProductFields(
  skus: string[],
  patch: { catSlug?: string; sub?: string; brandId?: number | null },
): Promise<{ count: number }> {
  const s = await requireAdmin();
  if (!Array.isArray(skus) || skus.length === 0) throw new Error("400:Select at least one product");
  if (skus.length > 500) throw new Error("400:Too many products in one operation (max 500)");
  const norm = [...new Set(skus.map((x) => String(x).trim().toUpperCase()).filter(Boolean))];
  if (!norm.length) throw new Error("400:Select at least one product");
  if (patch.catSlug === undefined && patch.sub === undefined && patch.brandId === undefined) {
    throw new Error("400:Nothing to update");
  }

  const set: { catSlug?: string; sub?: string; brandId?: number | null } = {};
  if (patch.catSlug !== undefined) {
    const [cat] = await db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.slug, patch.catSlug));
    if (!cat) throw new Error("400:Unknown category");
    set.catSlug = cat.slug;
  }
  if (patch.sub !== undefined) {
    const sub = patch.sub.trim();
    if (!sub || sub.length > 120) throw new Error("400:A subtitle up to 120 characters is required");
    set.sub = sub;
  }
  if (patch.brandId !== undefined) {
    if (patch.brandId !== null) {
      const [b] = await db.select({ id: schema.brands.id }).from(schema.brands).where(eq(schema.brands.id, patch.brandId));
      if (!b) throw new Error("400:Unknown brand");
    }
    set.brandId = patch.brandId;
  }

  const known = new Set(
    (await db.select({ sku: schema.products.sku }).from(schema.products)).map((x) => x.sku)
  );
  const valid = norm.filter((x) => known.has(x));
  if (!valid.length) throw new Error("400:None of the selected products were found");

  await db.update(schema.products).set(set).where(inArray(schema.products.sku, valid));
  await audit(s.userId, "product.bulk-update-fields", "product", "bulk", {
    patch, count: valid.length, skus: valid,
  });
  return { count: valid.length };
}

/** Permanently deletes products — unlike active/inactive (which only hides
 *  a product from the catalogue), this removes the row. Handles 1..500 SKUs
 *  so the same path backs both the per-row "Delete" action and the bulk
 *  "Delete selected" control (same 500-row cap as every other bulk product
 *  mutation). A SKU is silently skipped, not failed, when it has real order
 *  or purchase-order history on record — those are the actual historical
 *  transaction — rather than erroring out the whole batch; the caller
 *  reports back exactly which SKUs were skipped and why, so an admin
 *  bulk-deleting a bad import still gets everything deletable deleted in
 *  one pass. Cart lines and a SKU-specific price rule are NOT historical
 *  records, so they're cleaned up alongside the product rather than
 *  blocking the delete on them. */
export async function deleteProducts(
  skus: string[]
): Promise<{ deleted: string[]; blocked: { sku: string; reason: string }[] }> {
  const s = await requireAdmin();
  if (!Array.isArray(skus) || skus.length === 0) throw new Error("400:Select at least one product");
  if (skus.length > 500) throw new Error("400:Too many products in one operation (max 500)");
  const norm = [...new Set(skus.map((x) => String(x).trim().toUpperCase()).filter(Boolean))];
  if (!norm.length) throw new Error("400:Select at least one product");

  const known = new Set(
    (await db.select({ sku: schema.products.sku }).from(schema.products).where(inArray(schema.products.sku, norm))).map((x) => x.sku)
  );
  const withOrders = new Set(
    (await db.select({ sku: schema.orderLines.sku }).from(schema.orderLines).where(inArray(schema.orderLines.sku, norm))).map((x) => x.sku)
  );
  const withPos = new Set(
    (await db.select({ sku: schema.purchaseOrders.sku }).from(schema.purchaseOrders).where(inArray(schema.purchaseOrders.sku, norm)))
      .map((x) => x.sku)
      .filter((x): x is string => x !== null)
  );

  const deleted: string[] = [];
  const blocked: { sku: string; reason: string }[] = [];
  for (const sku of norm) {
    if (!known.has(sku)) { blocked.push({ sku, reason: "not found" }); continue; }
    if (withOrders.has(sku)) { blocked.push({ sku, reason: "has order history — deactivate it instead" }); continue; }
    if (withPos.has(sku)) { blocked.push({ sku, reason: "has purchase-order history — deactivate it instead" }); continue; }
    await db.delete(schema.cartLines).where(eq(schema.cartLines.sku, sku));
    await db.delete(schema.priceRules).where(eq(schema.priceRules.sku, sku));
    await db.delete(schema.products).where(eq(schema.products.sku, sku));
    deleted.push(sku);
  }

  if (deleted.length) {
    await audit(s.userId, "product.delete", "product", "bulk", {
      count: deleted.length, skus: deleted, blockedCount: blocked.length,
    });
  }
  return { deleted, blocked };
}

/** Upsert the category-default price rule (OBD-20 decided structure) for a
 *  category — the approved-buyer base discount tier. Reuses the same bp bounds
 *  as createPriceRule (0..9000). */
export async function bulkApplyCategoryDiscount(
  catSlug: string, discountBp: number
): Promise<{ id: number; updated: boolean }> {
  const s = await requireAdmin();
  if (!Number.isInteger(discountBp) || discountBp < 0 || discountBp > 9000) {
    throw new Error("400:Discount must be a whole number of basis points between 0 and 9000");
  }
  const [cat] = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, catSlug));
  if (!cat) throw new Error("400:Unknown category");
  const [existing] = await db
    .select()
    .from(schema.priceRules)
    .where(
      and(
        eq(schema.priceRules.scope, "category-default"),
        eq(schema.priceRules.catSlug, cat.slug),
        isNull(schema.priceRules.orgId)
      )
    );
  if (existing) {
    await db
      .update(schema.priceRules)
      .set({ discountPct: discountBp })
      .where(eq(schema.priceRules.id, existing.id));
    await audit(s.userId, "price-rule.upsert", "price_rule", String(existing.id), {
      scope: "category-default", catSlug: cat.slug, discountBp,
    });
    return { id: existing.id, updated: true };
  }
  const [row] = await db
    .insert(schema.priceRules)
    .values({ scope: "category-default", orgId: null, catSlug: cat.slug, sku: null, discountPct: discountBp })
    .returning();
  await audit(s.userId, "price-rule.upsert", "price_rule", String(row.id), {
    scope: "category-default", catSlug: cat.slug, discountBp,
  });
  return { id: row.id, updated: false };
}

/** Reprice many products at once (validate all before writing any). */
export async function bulkRepriceProducts(
  updates: { sku: string; std: number }[]
): Promise<{ count: number }> {
  const s = await requireAdmin();
  if (!Array.isArray(updates) || updates.length === 0) throw new Error("400:No price updates supplied");
  if (updates.length > 500) throw new Error("400:Too many products in one operation (max 500)");
  const norm = updates.map((u) => ({ sku: String(u.sku).trim().toUpperCase(), std: u.std }));
  for (const u of norm) {
    if (!u.sku) throw new Error("400:Each update needs a SKU");
    assertStd(u.std);
  }
  const known = new Set(
    (await db.select({ sku: schema.products.sku }).from(schema.products)).map((x) => x.sku)
  );
  const bad = [...new Set(norm.filter((u) => !known.has(u.sku)).map((u) => u.sku))];
  if (bad.length) throw new Error(`400:Unknown products: ${bad.join(", ")}`);
  for (const u of norm) {
    await db.update(schema.products).set({ stdPaise: Math.round(u.std * 100) }).where(eq(schema.products.sku, u.sku));
  }
  await audit(s.userId, "product.bulk-reprice", "product", "bulk", {
    count: norm.length, skus: norm.map((u) => u.sku),
  });
  return { count: norm.length };
}

/* ---------- 4 · supplier performance (read-only analytics) ---------- */

/** Per active supplier: quotation win rate, PO issuance/closure, direct
 *  delivery-proof posture, total PO value and outstanding balance — all
 *  derived from existing procurement tables. Ranked by PO value. */
export async function getSupplierPerformance(): Promise<SupplierPerformanceRow[]> {
  if (!(await adminSession())) return [];
  const suppliers = await db
    .select()
    .from(schema.organizations)
    .where(and(eq(schema.organizations.kind, "supplier"), eq(schema.organizations.status, "active")));
  const quotes = await db
    .select({
      supplierOrgId: schema.quotations.supplierOrgId,
      status: schema.quotations.status,
    })
    .from(schema.quotations);
  const pos = await db
    .select({
      supplierOrgId: schema.purchaseOrders.supplierOrgId,
      destination: schema.purchaseOrders.destination,
      fulfilment: schema.purchaseOrders.fulfilment,
      valuePaise: schema.purchaseOrders.valuePaise,
      outstandingPaise: schema.purchaseOrders.outstandingPaise,
    })
    .from(schema.purchaseOrders);

  const by = new Map<number, SupplierPerformanceRow & { _value: number; _out: number }>();
  for (const sup of suppliers) {
    by.set(sup.id, {
      orgId: sup.id, name: sup.name, quotesSubmitted: 0, quotesAwarded: 0, winRate: 0,
      posIssued: 0, posClosed: 0, posInFlight: 0, proofsOnRecord: 0, awaitingProof: 0,
      poValueTotal: 0, outstanding: 0, _value: 0, _out: 0,
    });
  }
  for (const q of quotes) {
    const row = by.get(q.supplierOrgId);
    if (!row) continue;
    row.quotesSubmitted += 1;
    if (q.status === "awarded") row.quotesAwarded += 1;
  }
  for (const p of pos) {
    const row = by.get(p.supplierOrgId);
    if (!row) continue;
    row.posIssued += 1;
    if (p.fulfilment === "closed") row.posClosed += 1;
    else row.posInFlight += 1;
    if (p.destination === "direct") {
      if (p.fulfilment === "delivered-proof" || p.fulfilment === "closed") row.proofsOnRecord += 1;
      if (p.fulfilment === "awaiting-proof") row.awaitingProof += 1;
    }
    row._value += p.valuePaise;
    row._out += p.outstandingPaise;
  }
  return [...by.values()]
    .map((row): SupplierPerformanceRow => ({
      orgId: row.orgId, name: row.name,
      quotesSubmitted: row.quotesSubmitted, quotesAwarded: row.quotesAwarded,
      winRate: row.quotesSubmitted > 0 ? Math.round((row.quotesAwarded / row.quotesSubmitted) * 100) : 0,
      posIssued: row.posIssued, posClosed: row.posClosed, posInFlight: row.posInFlight,
      proofsOnRecord: row.proofsOnRecord, awaitingProof: row.awaitingProof,
      poValueTotal: r(row._value), outstanding: r(row._out),
    }))
    .sort((a, b) => b.poValueTotal - a.poValueTotal || b.quotesAwarded - a.quotesAwarded);
}

/* ---------- 5 · payment reconciliation ---------- */

/** Orders with their payment status, declared-vs-total (mismatch flagged),
 *  verifier and confirmed date, plus confirmed/awaiting/failed totals. A
 *  focused operational view — no new money movement (OBD-21: no gateway). */
export async function getReconciliation(): Promise<Reconciliation> {
  const empty: Reconciliation = {
    rows: [],
    summary: {
      confirmedCount: 0, confirmedTotal: 0, awaitingCount: 0, awaitingTotal: 0,
      failedCount: 0, failedTotal: 0, mismatchCount: 0,
    },
  };
  if (!(await adminSession())) return empty;

  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.id));
  const pays = await db.select().from(schema.payments);
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const users = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const userEmail = new Map(users.map((u) => [u.id, u.email]));
  const payByOrder = new Map(pays.map((p) => [p.orderId, p]));

  let confirmedCount = 0, confirmedTotal = 0, awaitingCount = 0, awaitingTotal = 0;
  let failedCount = 0, failedTotal = 0, mismatchCount = 0;

  const rows = orders.map((o): ReconciliationRow => {
    const pay = payByOrder.get(o.id);
    const declared = pay?.declaredAmountPaise ?? null;
    const total = o.totalPaise;
    const mismatch = declared !== null && declared !== total;
    if (mismatch) mismatchCount += 1;
    const st = pay?.status ?? "";
    if (st === "confirmed") { confirmedCount += 1; confirmedTotal += total; }
    else if (st === "awaiting-verification") { awaitingCount += 1; awaitingTotal += total; }
    else if (st === "failed" || st === "cancelled-unpaid") { failedCount += 1; failedTotal += total; }
    return {
      orderId: o.id,
      orgName: orgName.get(o.orgId) ?? "",
      method: pay?.method ?? "",
      status: st,
      statusLabel: pay?.statusLabel ?? "",
      orderTotal: r(total),
      declaredAmount: declared !== null ? r(declared) : null,
      mismatch,
      confirmedAt: pay?.confirmedAt ?? null,
      verifiedBy: pay?.verifiedByUserId ? (userEmail.get(pay.verifiedByUserId) ?? null) : null,
    };
  });

  return {
    rows,
    summary: {
      confirmedCount, confirmedTotal: r(confirmedTotal),
      awaitingCount, awaitingTotal: r(awaitingTotal),
      failedCount, failedTotal: r(failedTotal),
      mismatchCount,
    },
  };
}

/* ---------- 6 · business analytics (extended report) ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse a display date like "14 Nov 2026" into a month label + sort key. */
function monthOf(placed: string): { label: string; sort: number } | null {
  const parts = placed.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const mon = parts[1];
  const year = Number(parts[2]);
  const mi = MONTHS.indexOf(mon);
  if (mi < 0 || !Number.isFinite(year)) return null;
  return { label: `${mon} ${year}`, sort: year * 12 + mi };
}

export async function getAnalytics(): Promise<AdminAnalytics | null> {
  if (!(await adminSession())) return null;
  const orders = await db
    .select({
      id: schema.orders.id, orgId: schema.orders.orgId, placed: schema.orders.placed,
      statusLabel: schema.orders.statusLabel, totalPaise: schema.orders.totalPaise,
    })
    .from(schema.orders);
  const lines = await db
    .select({
      unitPaise: schema.orderLines.unitPaise,
      qty: schema.orderLines.qty,
      catSlug: schema.products.catSlug,
    })
    .from(schema.orderLines)
    .innerJoin(schema.products, eq(schema.orderLines.sku, schema.products.sku));
  const pos = await db
    .select({
      supplierOrgId: schema.purchaseOrders.supplierOrgId,
      valuePaise: schema.purchaseOrders.valuePaise,
      fulfilment: schema.purchaseOrders.fulfilment,
    })
    .from(schema.purchaseOrders);
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizations);
  const cats = await db.select().from(schema.categories);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const catName = new Map(cats.map((c) => [c.slug, c.name]));

  // orders by status (count + value)
  const byStatus = new Map<string, { count: number; value: number }>();
  for (const o of orders) {
    const cur = byStatus.get(o.statusLabel) ?? { count: 0, value: 0 };
    cur.count += 1; cur.value += o.totalPaise;
    byStatus.set(o.statusLabel, cur);
  }

  // monthly trend by placed month
  const months = new Map<number, { label: string; count: number; value: number }>();
  for (const o of orders) {
    const m = monthOf(o.placed);
    if (!m) continue;
    const cur = months.get(m.sort) ?? { label: m.label, count: 0, value: 0 };
    cur.count += 1; cur.value += o.totalPaise;
    months.set(m.sort, cur);
  }

  // top categories by order value
  const catValue = new Map<string, number>();
  for (const l of lines) catValue.set(l.catSlug, (catValue.get(l.catSlug) ?? 0) + l.unitPaise * l.qty);

  // top buyers by order value
  const buyerAgg = new Map<number, { orders: number; value: number }>();
  for (const o of orders) {
    const cur = buyerAgg.get(o.orgId) ?? { orders: 0, value: 0 };
    cur.orders += 1; cur.value += o.totalPaise;
    buyerAgg.set(o.orgId, cur);
  }

  // top suppliers by PO value
  const supAgg = new Map<number, { pos: number; value: number }>();
  for (const p of pos) {
    const cur = supAgg.get(p.supplierOrgId) ?? { pos: 0, value: 0 };
    cur.pos += 1; cur.value += p.valuePaise;
    supAgg.set(p.supplierOrgId, cur);
  }

  // fulfilment funnel — current stage (counts sum to total POs)
  const stage = { issued: 0, acknowledged: 0, proof: 0, closed: 0 };
  for (const p of pos) {
    if (p.fulfilment === "issued") stage.issued += 1;
    else if (p.fulfilment === "acknowledged") stage.acknowledged += 1;
    else if (p.fulfilment === "awaiting-proof" || p.fulfilment === "delivered-proof") stage.proof += 1;
    else if (p.fulfilment === "closed") stage.closed += 1;
  }

  return {
    orders: {
      count: orders.length,
      gmv: r(orders.reduce((sum, o) => sum + o.totalPaise, 0)),
      byStatus: [...byStatus.entries()]
        .map(([label, v]) => ({ label, count: v.count, value: r(v.value) }))
        .sort((a, b) => b.value - a.value),
    },
    monthlyTrend: [...months.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => ({ month: v.label, count: v.count, value: r(v.value) })),
    topCategories: [...catValue.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([slug, paise]) => ({ slug, name: catName.get(slug) ?? slug, value: r(paise) })),
    topBuyers: [...buyerAgg.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 8)
      .map(([orgId, v]) => ({ orgId, name: orgName.get(orgId) ?? `Org ${orgId}`, orders: v.orders, value: r(v.value) })),
    topSuppliers: [...supAgg.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 8)
      .map(([orgId, v]) => ({ orgId, name: orgName.get(orgId) ?? `Org ${orgId}`, pos: v.pos, value: r(v.value) })),
    fulfilmentFunnel: [
      { label: "Issued · awaiting acknowledgement", count: stage.issued },
      { label: "Acknowledged", count: stage.acknowledged },
      { label: "Awaiting / delivered proof", count: stage.proof },
      { label: "Closed", count: stage.closed },
    ],
  };
}

/* ---------- 7 · CSV exports ---------- */

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const out = [headers.map(csvCell).join(",")];
  for (const row of rows) out.push(row.map(csvCell).join(","));
  return `${out.join("\r\n")}\r\n`;
}

/** Build a CSV for one of the exportable datasets, admin-gated. Reuses the
 *  same read services so exports never diverge from the on-screen tables.
 *  Returns the filename + body; the route sets the download headers. */
export async function exportCsv(kind: string): Promise<{ filename: string; csv: string }> {
  await requireAdmin();
  const stamp = new Date().toISOString().slice(0, 10);
  const file = (name: string) => `smash pro-${name}-${stamp}.csv`;

  switch (kind) {
    case "orders": {
      const rows = await ordersForAdmin();
      return {
        filename: file("orders"),
        csv: toCsv(
          ["Order", "Buyer", "Placed", "Status", "Direct", "Lines", "Total (INR)", "Payment status"],
          rows.map((o) => [
            o.id, o.orgName, o.placed, o.statusLabel, o.direct ? "direct" : "warehouse",
            o.lineCount, o.total.toFixed(2), o.paymentStatusLabel,
          ])
        ),
      };
    }
    case "payments": {
      const rows = await paymentsForAdmin();
      return {
        filename: file("payments"),
        csv: toCsv(
          ["Order", "Buyer", "Method", "Status", "Order total (INR)", "Declared (INR)", "Proof file"],
          rows.map((p) => [
            p.orderId, p.orgName, p.method, p.statusLabel, p.total.toFixed(2),
            p.declaredAmount !== null ? p.declaredAmount.toFixed(2) : "", p.proofFilename ?? "",
          ])
        ),
      };
    }
    case "organizations": {
      const rows = await getOrganizationsFull();
      return {
        filename: file("organizations"),
        csv: toCsv(
          ["ID", "Kind", "Status", "Name", "Type", "City", "GSTIN", "Contact", "Email", "Orders", "POs", "Total value (INR)", "Submitted"],
          rows.map((o) => [
            o.id, o.kind, o.status, o.name, o.orgType, o.city, o.gstin, o.contactName,
            o.email, o.orderCount, o.poCount, o.totalValue.toFixed(2), o.submitted,
          ])
        ),
      };
    }
    case "supplier-performance": {
      const rows = await getSupplierPerformance();
      return {
        filename: file("supplier-performance"),
        csv: toCsv(
          ["Supplier", "Quotes submitted", "Quotes awarded", "Win rate (%)", "POs issued", "POs closed", "POs in flight", "Proofs on record", "Awaiting proof", "PO value (INR)", "Outstanding (INR)"],
          rows.map((s) => [
            s.name, s.quotesSubmitted, s.quotesAwarded, s.winRate, s.posIssued, s.posClosed,
            s.posInFlight, s.proofsOnRecord, s.awaitingProof, s.poValueTotal.toFixed(2), s.outstanding.toFixed(2),
          ])
        ),
      };
    }
    case "audit-log": {
      const page = await getAuditLog({ limit: 1000, offset: 0 });
      return {
        filename: file("audit-log"),
        csv: toCsv(
          ["ID", "Timestamp", "Actor", "Role", "Action", "Entity", "Entity ID", "Detail"],
          page.rows.map((a) => [
            a.id, a.at, a.actorEmail ?? "", a.actorRole ?? "", a.action, a.entity, a.entityId, a.detail ?? "",
          ])
        ),
      };
    }
    default:
      throw new Error("404");
  }
}

/* ---------- self-service account (own login email/password) ---------- */

/** Fetches the row for the current session's own password hash — never
 *  another user's, and never exposed past this module (the hash itself
 *  is only ever compared, never returned to a caller). */
async function currentPasswordOk(userId: number, currentPassword: string): Promise<boolean> {
  const [row] = await db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId));
  if (!row) return false;
  return bcrypt.compare(currentPassword, row.passwordHash);
}

export async function updateOwnAdminEmail(input: { currentPassword: string; newEmail: string }): Promise<void> {
  const s = await requireAdmin();
  const email = input.newEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("400:Enter a valid email address");
  }
  if (!(await currentPasswordOk(s.userId, input.currentPassword))) {
    throw new Error("400:Current password is incorrect");
  }
  if (email === s.email.toLowerCase()) {
    throw new Error("400:That's already your current email");
  }
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (existing) throw new Error("email-taken");
  await db.update(schema.users).set({ email }).where(eq(schema.users.id, s.userId));
  await audit(s.userId, "account.email_change", "user", String(s.userId), { from: s.email, to: email });
}

export async function updateOwnAdminPassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  const s = await requireAdmin();
  if (!input.newPassword || input.newPassword.length < 8) {
    throw new Error("400:New password must be at least 8 characters");
  }
  if (!(await currentPasswordOk(s.userId, input.currentPassword))) {
    throw new Error("400:Current password is incorrect");
  }
  if (await currentPasswordOk(s.userId, input.newPassword)) {
    throw new Error("400:New password must be different from your current password");
  }
  const newHash = await hashPassword(input.newPassword);
  await db.update(schema.users).set({ passwordHash: newHash }).where(eq(schema.users.id, s.userId));
  await audit(s.userId, "account.password_change", "user", String(s.userId), {});
}
