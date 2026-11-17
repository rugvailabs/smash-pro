import "server-only";
import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, requireAdmin, type SessionUser } from "@/server/auth";
import type {
  AdminComplaintRow, AdminCounts, AdminOrderDetail, AdminOrderRow, AdminOrgRow,
  AdminPaymentRow, AdminPoRow, AdminPriceRule, AdminProductRequestRow, AdminProductRow,
  AdminQuoteView, AdminReport, AdminRequirementDetail, AdminRequirementRow,
} from "@/lib/admin-types";

/* ============================================================
   Super Admin service (B5) — decided workflows only: org
   approval/rejection, direct-shipment flag (OBD-19 Option C),
   payment verification (OBD-21), catalogue & price rules
   (OBD-20 decided structure), order fulfilment advances,
   procurement (requirements → quotations → POs), complaints and
   product requests. Pending OBD items (GST rates/HSN, supplier
   commission, cancellation windows, verification checklists)
   are deliberately absent. Reads return null/empty for
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

function nextPoFulfilment(p: {
  fulfilment: string; destination: string;
}): { fulfilment: string; label: string } | null {
  if (p.fulfilment === "acknowledged" && p.destination === "direct") {
    return { fulfilment: "awaiting-proof", label: "Awaiting delivery proof" };
  }
  if (p.fulfilment === "acknowledged" || p.fulfilment === "delivered-proof") {
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
  return {
    pendingOrgs: orgs.filter((x) => x.status === "pending").length,
    paymentsToVerify: pays.filter((x) => x.status === "awaiting-verification").length,
    openComplaints: comps.filter((x) => x.status === "open").length,
    requirementsOpen: reqs.filter((x) => x.status === "open" || x.status === "quoted-revision").length,
    quotesAwaitingAction: quotes.filter((x) => x.status === "submitted").length,
    posInFlight: pos.filter((x) => x.f !== "closed").length,
    productRequestsInReview: preqs.filter((x) => x.status === "in-review").length,
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
  return rows.map((p) => ({
    sku: p.sku, name: p.name, catSlug: p.catSlug, sub: p.sub,
    std: r(p.stdPaise), active: p.active, configurable: p.configurable,
    hasImg: p.img !== null,
  }));
}

function assertStd(std: number) {
  if (typeof std !== "number" || !Number.isFinite(std) || std < 0.01 || std > 1_000_000) {
    throw new Error("400:Standard price must be between ₹0.01 and ₹10,00,000");
  }
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

/** Create a catalogue product. img stays null until approved photography
 *  exists (no placeholder imagery); hsn stays null and is NEVER settable
 *  until OBD-20/OBD-11 resolve with professional tax validation. */
export async function createProduct(input: {
  sku: string; name: string; catSlug: string; sub: string;
  meta?: string; std: number; specs?: [string, string][];
}): Promise<{ sku: string }> {
  const s = await requireAdmin();
  const sku = input.sku.trim().toUpperCase();
  if (!/^[A-Z]{2}-\d{4}$/.test(sku)) {
    throw new Error("400:SKU must match the pattern AB-0000");
  }
  const name = input.name.trim();
  const sub = input.sub.trim();
  const meta = (input.meta ?? "").trim();
  if (!name || name.length > 200) throw new Error("400:A product name up to 200 characters is required");
  if (!sub || sub.length > 120) throw new Error("400:A subtitle up to 120 characters is required");
  if (meta.length > 300) throw new Error("400:Meta is too long");
  assertStd(input.std);
  const specs = input.specs ?? [];
  assertSpecs(specs);
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
    sku, name, catSlug: cat.slug, sub, meta,
    stdPaise: Math.round(input.std * 100),
    img: null, gallery: null, hsn: null,
    configurable: false, directShip: false, specs, active: true,
  });
  await audit(s.userId, "product.create", "product", sku, { catSlug: cat.slug, std: input.std });
  return { sku };
}

/** Toggle active and/or update the standard price. hsn/img are not settable. */
export async function updateProduct(sku: string, patch: { active?: boolean; std?: number }) {
  const s = await requireAdmin();
  if (patch.active === undefined && patch.std === undefined) {
    throw new Error("400:Nothing to update");
  }
  const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  if (!p) throw new Error("404");
  const set: { active?: boolean; stdPaise?: number } = {};
  if (patch.active !== undefined) {
    if (typeof patch.active !== "boolean") throw new Error("400:active must be true or false");
    set.active = patch.active;
  }
  if (patch.std !== undefined) {
    assertStd(patch.std);
    set.stdPaise = Math.round(patch.std * 100);
  }
  await db.update(schema.products).set(set).where(eq(schema.products.sku, sku));
  await audit(s.userId, "product.update", "product", sku, patch);
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
      })),
      // supplier-side rows store "you" for the supplier's own messages
      messages: msgs.map((m) => ({
        from: (m.fromRole === "you" ? "supplier" : m.fromRole) as "prosmash" | "supplier" | "system",
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
    spec: req.spec, requiredBy: req.requiredBy,
    quotes,
  };
}

export async function createRequirement(input: {
  title: string; catSlug: string; qty: string; destination: string; closes: string;
  requiredBy?: string; spec?: [string, string][]; fromProductRequestId?: string;
}): Promise<{ id: string }> {
  const s = await requireAdmin();
  const title = input.title.trim();
  const qty = input.qty.trim();
  const closes = input.closes.trim();
  const requiredBy = input.requiredBy?.trim() || null;
  if (!title || title.length > 200) throw new Error("400:A title up to 200 characters is required");
  if (!qty || qty.length > 120) throw new Error("400:A quantity up to 120 characters is required");
  if (!closes || closes.length > 120) throw new Error("400:A closing time up to 120 characters is required");
  if (requiredBy && requiredBy.length > 120) throw new Error("400:required-by is too long");
  if (input.destination !== "warehouse" && input.destination !== "direct") {
    throw new Error("400:Destination must be warehouse or direct");
  }
  const spec = input.spec ?? null;
  if (spec) assertSpecs(spec);
  const [cat] = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, input.catSlug));
  if (!cat) throw new Error("400:Unknown category");

  let fromRequest: typeof schema.productRequests.$inferSelect | undefined;
  if (input.fromProductRequestId) {
    [fromRequest] = await db
      .select()
      .from(schema.productRequests)
      .where(eq(schema.productRequests.id, input.fromProductRequestId));
    if (!fromRequest) throw new Error("400:Unknown product request");
  }

  const rows = await db.select({ id: schema.requirements.id }).from(schema.requirements);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-4)) || 0), 0);
  const id = `REQ-2026-${String(max + 1).padStart(4, "0")}`;
  await db.insert(schema.requirements).values({
    id, title, catSlug: cat.slug, qty,
    destination: input.destination,
    published: fullDate(), closes,
    status: "open", statusLabel: "Open · not quoted",
    spec, requiredBy,
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
    `PROSMASH · ${fullDate()}, ${timeOfDay()}` + (v ? ` · re: v${v.v}` : "");
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "prosmash", meta, body,
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
    body: `ProSmash requested a revision · ${fullDate()}, ${timeOfDay()}${vRef}`,
  });
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "prosmash",
    meta: `PROSMASH · ${fullDate()}, ${timeOfDay()}${vRef}`,
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
  return rows.map((p) => ({
    id: p.id,
    supplierName: orgName.get(p.supplierOrgId) ?? "",
    destination: p.destination as AdminPoRow["destination"],
    issued: p.issued,
    lineName: p.lineName, lineQty: p.lineQty,
    unit: r(p.unitPaise), value: r(p.valuePaise),
    fulfilment: p.fulfilment as AdminPoRow["fulfilment"],
    fulfilmentLabel: p.fulfilmentLabel,
    received: r(p.receivedPaise), outstanding: r(p.outstandingPaise),
    payStatusLabel: p.payStatusLabel,
    nextFulfilment: nextPoFulfilment(p),
  }));
}

/** Issue a PO from an awarded quotation's latest version. Destination is
 *  admin-set (OBD-19 Option C — the supplier never chooses). */
export async function createPo(input: {
  quotationId: number; destination: string;
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

  const lineQty = parseLeadingInt(v.quantity) ?? parseLeadingInt(req.qty);
  if (!lineQty) {
    throw new Error("400:Could not determine the PO quantity from the quotation or requirement");
  }
  const valuePaise = v.unitPaise * lineQty;
  // integer-paise storage bound (technical, not a business rule)
  if (valuePaise > 1_900_000_000) {
    throw new Error("400:PO value is too large to process in one PO — please split it");
  }

  const rows = await db.select({ id: schema.purchaseOrders.id }).from(schema.purchaseOrders);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-5)) || 0), 0);
  const id = `PO-2026-${String(max + 1).padStart(5, "0")}`;
  const issued = fullDate();
  await db.insert(schema.purchaseOrders).values({
    id, supplierOrgId: q.supplierOrgId, quotationId: q.id,
    destination: input.destination, issued,
    lineName: req.title, lineQty,
    unitPaise: v.unitPaise, valuePaise,
    // demo simplification: the supplier acknowledgement flow is not built —
    // POs are issued directly in the acknowledged state
    fulfilment: "acknowledged", fulfilmentLabel: "Acknowledged",
    acknowledgedAt: `${issued}, ${timeOfDay()}`,
    dispatchBy: v.lead,
    dispatchedQty: `0 of ${lineQty}`, receivedQty: `0 of ${lineQty}`,
    awardedFrom: { reqId: q.reqId, version: `v${v.v}` },
    terms: { unit: r(v.unitPaise), qty: lineQty, lead: v.lead, validTill: v.validTill, payment: v.terms },
    paymentTerms: v.terms,
    receivedPaise: 0, outstandingPaise: valuePaise,
    payStatusLabel: /adv/i.test(v.terms) ? "Advance pending" : "As quoted",
    minDeliveryInfo: null, shipment: null,
  });
  await db
    .update(schema.requirements)
    .set({ poId: id })
    .where(eq(schema.requirements.id, q.reqId));
  await audit(s.userId, "po.create", "purchase_order", id, {
    quotationId: q.id, reqId: q.reqId, destination: input.destination, value: r(valuePaise),
  });
  return { id };
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
