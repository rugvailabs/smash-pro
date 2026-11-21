import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, type SessionUser } from "@/server/auth";
import { notifyAdmins } from "@/server/notifications";
import { SMASH_PRO_PICKUP_ADDRESS } from "@/lib/company-profile";
import { applyDiscountPaise, buyerTypeDiscountBp } from "@/server/pricing";
import { RACQUET_OPTIONS } from "@/data/products";
import type { BuyerRequest, Institution, Order, RacquetConfig } from "@/lib/types";
import type { BuyerAccount, BuyerAddress, ReorderResult } from "@/lib/buyer-api";

/* ============================================================
   Buyer commerce service (B3). Every function scopes to the
   session's organization — buyer data never serialises without
   an approved buyer session (PLT-001, server-enforced).
   Money converts paise → two-decimal rupees at this boundary.
   ============================================================ */

const r = (p: number) => Math.round(p) / 100;

async function approvedBuyer(): Promise<SessionUser | null> {
  const s = await getSession();
  return s && s.role === "buyer" && s.orgStatus === "active" && s.orgId !== null ? s : null;
}

/* ---------- institution ---------- */

export async function institutionForSession(): Promise<Institution | null> {
  const s = await approvedBuyer();
  if (!s) return null;
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId!));
  if (!org) return null;
  const addrs = await db.select().from(schema.addresses).where(eq(schema.addresses.orgId, org.id));
  const docs = await db.select().from(schema.documents).where(eq(schema.documents.orgId, org.id));
  return {
    name: org.name, city: org.city, legalName: org.legalName, orgType: org.orgType,
    gstin: org.gstin, contact: org.contactName, email: org.email,
    buyerCategory: org.buyerCategory ?? "",
    addresses: addrs.map((a) => ({ label: a.label, detail: a.detail, isDefault: a.isDefault || undefined })),
    documents: docs.map((d) => ({ file: d.filename, state: d.state })),
  };
}

/* ---------- orders ---------- */

function composeOrder(
  o: typeof schema.orders.$inferSelect,
  lines: (typeof schema.orderLines.$inferSelect)[],
  pay: typeof schema.payments.$inferSelect | undefined
): Order {
  return {
    id: o.id, placed: o.placed,
    status: o.status as Order["status"], statusLabel: o.statusLabel, direct: o.direct,
    lines: lines.map((l) => ({ sku: l.sku, name: l.name, unit: r(l.unitPaise), qty: l.qty })),
    subtotalExGst: r(o.subtotalExGstPaise), gst: r(o.gstPaise),
    shipping: o.shippingPaise === null ? null : r(o.shippingPaise),
    total: r(o.totalPaise),
    payment: {
      method: (pay?.method ?? "UPI") as Order["payment"]["method"],
      status: (pay?.status ?? "confirmed") as Order["payment"]["status"],
      statusLabel: pay?.statusLabel ?? "",
      reference: pay?.reference ?? undefined,
      confirmedAt: pay?.confirmedAt ?? undefined,
      proofFile: pay?.proofFilename ?? undefined,
      proofUploadedAt: pay?.proofUploadedAt ?? undefined,
      declaredAmount: pay?.declaredAmountPaise != null ? r(pay.declaredAmountPaise) : undefined,
    },
    shipTo: o.shipTo,
    deliveryMethod: o.deliveryMethod as Order["deliveryMethod"],
    pickupNote: o.pickupNote ?? undefined,
    dispatched: o.dispatchedAt ?? undefined,
    transportRef: o.transportRef ?? undefined,
    deliveredOn: o.deliveredOn ?? undefined,
    deliveryProofOnRecord: o.deliveryProofOnRecord || undefined,
    receiptConfirmed: o.receiptConfirmed || undefined,
    rail: o.rail,
  };
}

export async function ordersForSession(): Promise<Order[]> {
  const s = await approvedBuyer();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orgId, s.orgId!))
    .orderBy(desc(schema.orders.id));
  const out: Order[] = [];
  for (const o of rows) {
    const lines = await db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, o.id));
    const [pay] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, o.id));
    out.push(composeOrder(o, lines, pay));
  }
  return out;
}

export async function orderForSession(id: string): Promise<Order | undefined> {
  const s = await approvedBuyer();
  if (!s) return undefined;
  const [o] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.orgId, s.orgId!)));
  if (!o) return undefined;
  const lines = await db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, o.id));
  const [pay] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, o.id));
  return composeOrder(o, lines, pay);
}

/* ---------- requests (BUY-007) ---------- */

export async function requestsForSession(): Promise<BuyerRequest[]> {
  const s = await approvedBuyer();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.productRequests)
    .where(eq(schema.productRequests.orgId, s.orgId!))
    .orderBy(desc(schema.productRequests.id));
  return rows.map((x) => ({
    id: x.id, title: x.title, category: x.category, qty: x.qty,
    neededBy: x.neededBy ?? undefined, submitted: x.submitted,
    status: x.status as BuyerRequest["status"], statusLabel: x.statusLabel,
  }));
}

export async function createRequest(input: {
  title: string; category: string; qty: number; neededBy?: string; spec?: string;
}): Promise<BuyerRequest> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const rows = await db.select({ id: schema.productRequests.id }).from(schema.productRequests);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-4)) || 0), 0);
  const id = `REQ-2026-${String(max + 1).padStart(4, "0")}`;
  const submitted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  await db.insert(schema.productRequests).values({
    id, orgId: s.orgId!, title: input.title, category: input.category,
    qty: input.qty, neededBy: input.neededBy ?? null, submitted,
    status: "in-review", statusLabel: "In sourcing review",
  });
  await audit(s.userId, "request.create", "product_request", id, input);
  return {
    id, title: input.title, category: input.category, qty: input.qty,
    neededBy: input.neededBy, submitted, status: "in-review", statusLabel: "In sourcing review",
  };
}

/* ---------- cart (server-side, approved buyers only) ---------- */

export interface CartLineDto {
  key: string; sku: string; qty: number;
  config: RacquetConfig | null; delta: number;
  name: string; img?: string; unit: number; total: number;
}
export interface CartDto {
  lines: CartLineDto[];
  count: number;
  itemsIncl: number;
  subtotalExGst: number;
  gst: number;
  shipping: number;
  total: number;
  /** OBD-22 — whether free Smash-Pro-managed delivery is available for this
   *  cart's current items total (before any shipping line). */
  freeDeliveryEligible: boolean;
}

/** OBD-22 — free managed-delivery threshold, GST-inclusive items total.
 *  Below this, managed delivery is not offered at all (self-pickup or
 *  self-arranged courier only); at/above it, managed delivery is free.
 *  There is no paid managed-delivery tier. */
export const FREE_DELIVERY_THRESHOLD_PAISE = 50_000_00;

/** OBD-22 — single warehouse pickup location, now confirmed (ADR-0018
 *  amendment resolves the prior PENDING CONFIRMATION placeholder). Snapshotted
 *  onto any order that chooses self-pickup OR a self-arranged courier — a
 *  courier (Porter/Rapido/Uber, etc.) needs this same address to collect
 *  from, exactly as a self-pickup buyer does. Never the supplier's own
 *  address, which stays internal to Smash Pro ops. */
export const PICKUP_ADDRESS_PLACEHOLDER = SMASH_PRO_PICKUP_ADDRESS;

/** Illustrative GST portion of GST-inclusive totals — rates per product HSN
 *  pending OBD-20/OBD-11; presentation split mirrors the approved preview. */
function gstSplit(itemsInclPaise: number) {
  const gst = Math.round(itemsInclPaise * 0.1067);
  return { subtotal: itemsInclPaise - gst, gst };
}

export async function cartForSession(): Promise<CartDto | null> {
  const s = await approvedBuyer();
  if (!s) return null;
  const lines = await db
    .select()
    .from(schema.cartLines)
    .where(eq(schema.cartLines.userId, s.userId))
    .orderBy(asc(schema.cartLines.id));
  const out: CartLineDto[] = [];
  let itemsIncl = 0;
  // buyer-type discount is uniform across all products — resolve it once
  const bp = await buyerTypeDiscountBp(s.orgId!);
  for (const l of lines) {
    const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, l.sku));
    if (!p) continue;
    const unitPaise = applyDiscountPaise(p.stdPaise, bp) + l.deltaPaise;
    const totalPaise = unitPaise * l.qty;
    itemsIncl += totalPaise;
    out.push({
      key: l.key, sku: l.sku, qty: l.qty, config: l.config ?? null, delta: r(l.deltaPaise),
      name: p.name, img: p.img ?? undefined, unit: r(unitPaise), total: r(totalPaise),
    });
  }
  const { subtotal, gst } = gstSplit(itemsIncl);
  // OBD-22: warehouse-fulfilled orders never carry a shipping charge —
  // self-pickup/self-courier are the buyer's own arrangement, and managed
  // delivery (when eligible) is free. Shipping is always 0 here.
  return {
    lines: out,
    count: out.reduce((s2, l) => s2 + l.qty, 0),
    itemsIncl: r(itemsIncl),
    subtotalExGst: r(subtotal),
    gst: r(gst),
    shipping: 0,
    total: r(itemsIncl),
    freeDeliveryEligible: itemsIncl >= FREE_DELIVERY_THRESHOLD_PAISE,
  };
}

export const MAX_LINE_QTY = 9999;

/** Whole-number institutional quantities within processable bounds. */
function assertQty(qty: number) {
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QTY) {
    throw new Error(`400:Quantity must be a whole number between 1 and ${MAX_LINE_QTY}`);
  }
}

/** Validates a racquet configuration against the canonical option set and
 *  returns it in normalised field order plus the SERVER-computed stringing
 *  surcharge — client-supplied price adjustments are never accepted. */
function validateRacquetConfig(config: Partial<RacquetConfig> | undefined): {
  config: RacquetConfig;
  surchargePaise: number;
} {
  const str = RACQUET_OPTIONS.string.find((o) => o.value === config?.string);
  const tension = RACQUET_OPTIONS.tension.find((o) => o.value === config?.tension);
  const grip = RACQUET_OPTIONS.grip.find((o) => o.value === config?.grip);
  if (!str || !tension || !grip) throw new Error("400:Invalid racquet configuration");
  return {
    config: { string: str.value, tension: tension.value, grip: grip.value },
    surchargePaise: Math.round((str.delta ?? 0) * 100),
  };
}

export async function addCartLine(sku: string, qty: number, config?: RacquetConfig) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  assertQty(qty);
  const [product] = await db
    .select({ sku: schema.products.sku, active: schema.products.active, configurable: schema.products.configurable })
    .from(schema.products).where(eq(schema.products.sku, sku));
  if (!product || !product.active) throw new Error("404");

  let normalised: RacquetConfig | null = null;
  let surchargePaise = 0;
  if (product.configurable) {
    if (!config) throw new Error("400:This product requires a racquet configuration");
    ({ config: normalised, surchargePaise } = validateRacquetConfig(config));
  } else if (config) {
    throw new Error("400:This product does not take a configuration");
  }

  const key = sku + (normalised ? "|" + JSON.stringify(normalised) : "");
  const [existing] = await db
    .select()
    .from(schema.cartLines)
    .where(and(eq(schema.cartLines.userId, s.userId), eq(schema.cartLines.key, key)));
  if (existing) {
    await db
      .update(schema.cartLines)
      .set({ qty: Math.min(MAX_LINE_QTY, existing.qty + qty) })
      .where(eq(schema.cartLines.id, existing.id));
  } else {
    await db.insert(schema.cartLines).values({
      userId: s.userId, key, sku, qty, config: normalised, deltaPaise: surchargePaise,
    });
  }
}

export async function setCartQty(key: string, qty: number) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  assertQty(qty);
  await db
    .update(schema.cartLines)
    .set({ qty })
    .where(and(eq(schema.cartLines.userId, s.userId), eq(schema.cartLines.key, key)));
}

export async function removeCartLine(key: string) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  await db
    .delete(schema.cartLines)
    .where(and(eq(schema.cartLines.userId, s.userId), eq(schema.cartLines.key, key)));
}

export async function clearCart() {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  await db.delete(schema.cartLines).where(eq(schema.cartLines.userId, s.userId));
}

/* ---------- checkout (OBD-08 / ADR-0006) ---------- */

export async function createOrderFromCart(input: {
  shipTo: string;
  method: "UPI" | "Card" | "Net Banking" | "NEFT" | "RTGS" | "Cheque";
  deliveryMethod: "managed" | "self-pickup" | "self-courier";
}): Promise<{ orderId: string; paymentStatus: string }> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const cart = await cartForSession();
  if (!cart || cart.lines.length === 0) throw new Error("cart-empty");
  // technical processing bound (integer-paise storage), not a business rule
  if (cart.total > 19_000_000) {
    throw new Error("400:Order total is too large to process in one order — please split it");
  }
  // OBD-22: managed delivery is only ever offered at/above the free-delivery
  // threshold — re-validated server-side, never trusting the client's choice.
  if (input.deliveryMethod === "managed" && !cart.freeDeliveryEligible) {
    throw new Error(
      "400:Smash Pro delivery is only available, free, for orders of ₹50,000 or more — choose self-pickup or your own courier for this order."
    );
  }

  const rows = await db.select({ id: schema.orders.id }).from(schema.orders);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-5)) || 0), 0);
  const orderId = `ORD-2026-${String(max + 1).padStart(5, "0")}`;
  const placed = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const shortDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const offline = ["NEFT", "RTGS", "Cheque"].includes(input.method);
  // Online methods auto-confirm in the DEMO (no gateway — OBD-21 ◇); the UI
  // labels this clearly. Offline follows the decided proof+verification path.
  const payStatus = offline ? "awaiting-verification" : "confirmed";

  const rail: { label: string; date?: string; state: "done" | "cur" | "todo" }[] = offline
    ? [
        { label: "Placed", date: shortDate, state: "cur" },
        { label: "Confirmed", state: "todo" },
        { label: "Processing", state: "todo" },
        { label: "Dispatched", state: "todo" },
        { label: "Delivered", state: "todo" },
      ]
    : [
        { label: "Placed", date: shortDate, state: "done" },
        { label: "Confirmed", date: shortDate, state: "done" },
        { label: "Processing", date: shortDate, state: "cur" },
        { label: "Dispatched", state: "todo" },
        { label: "Delivered", state: "todo" },
      ];

  await db.insert(schema.orders).values({
    id: orderId, orgId: s.orgId!, userId: s.userId,
    placed, rail,
    status: offline ? "placed" : "processing",
    statusLabel: offline ? "Placed" : "Processing",
    direct: false,
    subtotalExGstPaise: Math.round(cart.subtotalExGst * 100),
    gstPaise: Math.round(cart.gst * 100),
    shippingPaise: Math.round(cart.shipping * 100),
    totalPaise: Math.round(cart.total * 100),
    shipTo: input.shipTo,
    deliveryMethod: input.deliveryMethod,
    // self-courier also needs the collection address — the buyer's own
    // courier (Porter/Rapido/Uber, etc.) picks up from here, same as a
    // self-pickup buyer would in person
    pickupNote: input.deliveryMethod === "self-pickup" || input.deliveryMethod === "self-courier"
      ? PICKUP_ADDRESS_PLACEHOLDER
      : null,
  });
  await db.insert(schema.orderLines).values(
    cart.lines.map((l) => ({
      orderId, sku: l.sku, name: l.name,
      unitPaise: Math.round(l.unit * 100), qty: l.qty, config: l.config,
    }))
  );
  await db.insert(schema.payments).values({
    orderId, method: input.method,
    status: payStatus,
    statusLabel: offline ? "Awaiting verification" : "Payment confirmed",
    reference: offline ? null : `TXN-DEMO-${String(Date.now()).slice(-6)}`,
    confirmedAt: offline ? null : `${placed}`,
  });
  await db.delete(schema.cartLines).where(eq(schema.cartLines.userId, s.userId));
  await audit(s.userId, "order.create", "order", orderId, {
    method: input.method, deliveryMethod: input.deliveryMethod, total: cart.total,
  });
  return { orderId, paymentStatus: payStatus };
}

export async function submitPaymentProof(orderId: string, filename: string, declaredAmount?: number) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  if (!filename.trim() || filename.length > 200) throw new Error("400:A valid proof filename is required");
  if (declaredAmount != null && (!Number.isFinite(declaredAmount) || declaredAmount <= 0 || declaredAmount > 20_000_000)) {
    throw new Error("400:Declared amount must be a positive amount in rupees");
  }
  const [o] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.orgId, s.orgId!)));
  if (!o) throw new Error("404");
  const uploaded = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  await db
    .update(schema.payments)
    .set({
      proofFilename: filename,
      proofUploadedAt: uploaded,
      declaredAmountPaise: declaredAmount != null ? Math.round(declaredAmount * 100) : null,
      status: "awaiting-verification",
      statusLabel: "Awaiting verification",
    })
    .where(eq(schema.payments.orderId, orderId));
  await audit(s.userId, "payment.proof", "order", orderId, { filename });
}

export async function confirmReceipt(orderId: string) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const [o] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.orgId, s.orgId!)));
  if (!o || o.status !== "confirm-receipt") throw new Error("404");
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const rail = o.rail.map((step) =>
    step.state === "cur" ? { ...step, label: "Delivered", state: "done" as const } : step
  );
  rail.push({ label: "Receipt confirmed", date, state: "cur" });
  await db
    .update(schema.orders)
    .set({ status: "delivered", statusLabel: "Delivered", receiptConfirmed: true, rail })
    .where(eq(schema.orders.id, orderId));
  await audit(s.userId, "order.confirm-receipt", "order", orderId);
}

export async function createComplaint(orderId: string, body: string) {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const [o] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.orgId, s.orgId!)));
  if (!o) throw new Error("404");
  await db.insert(schema.complaints).values({ orderId, orgId: s.orgId!, body });
  await audit(s.userId, "complaint.create", "order", orderId);
}

/* ============================================================
   Buyer account management (BUY-009). All mutations are strictly
   org-scoped — an address or org row belonging to another org is
   never touched (404 if not owned). Sensitive-field edits route to
   Smash Pro re-review (DECIDED) rather than applying directly.
   ============================================================ */

/** Trim + require + length-bound a user-supplied string, or throw 400. */
function boundedStr(v: unknown, label: string, max: number): string {
  if (typeof v !== "string") throw new Error(`400:${label} is required`);
  const t = v.trim();
  if (!t) throw new Error(`400:${label} is required`);
  if (t.length > max) throw new Error(`400:${label} must be ${max} characters or fewer`);
  return t;
}

/* ---------- delivery addresses — full CRUD ---------- */

export async function listAddresses(): Promise<BuyerAddress[]> {
  const s = await approvedBuyer();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.addresses)
    .where(eq(schema.addresses.orgId, s.orgId!))
    .orderBy(desc(schema.addresses.isDefault), asc(schema.addresses.id));
  return rows.map((a) => ({ id: a.id, label: a.label, detail: a.detail, isDefault: a.isDefault }));
}

export async function addAddress(input: {
  label: string; detail: string; isDefault?: boolean;
}): Promise<BuyerAddress> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const label = boundedStr(input.label, "Label", 80);
  const detail = boundedStr(input.detail, "Address", 240);
  const existing = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(eq(schema.addresses.orgId, s.orgId!));
  // the org's first address is always the default; otherwise honour the flag
  const makeDefault = input.isDefault === true || existing.length === 0;
  if (makeDefault) {
    await db.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.orgId, s.orgId!));
  }
  const [row] = await db
    .insert(schema.addresses)
    .values({ orgId: s.orgId!, label, detail, isDefault: makeDefault })
    .returning();
  await audit(s.userId, "address.create", "address", String(row.id), { label, isDefault: makeDefault });
  return { id: row.id, label: row.label, detail: row.detail, isDefault: row.isDefault };
}

export async function updateAddress(id: number, input: { label: string; detail: string }): Promise<void> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const label = boundedStr(input.label, "Label", 80);
  const detail = boundedStr(input.detail, "Address", 240);
  const [owned] = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  if (!owned) throw new Error("404");
  await db
    .update(schema.addresses)
    .set({ label, detail })
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  await audit(s.userId, "address.update", "address", String(id), { label });
}

export async function deleteAddress(id: number): Promise<void> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const [owned] = await db
    .select()
    .from(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  if (!owned) throw new Error("404");
  await db
    .delete(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  // if the removed address was the default, promote the oldest remaining one
  if (owned.isDefault) {
    const [next] = await db
      .select({ id: schema.addresses.id })
      .from(schema.addresses)
      .where(eq(schema.addresses.orgId, s.orgId!))
      .orderBy(asc(schema.addresses.id));
    if (next) {
      await db.update(schema.addresses).set({ isDefault: true }).where(eq(schema.addresses.id, next.id));
    }
  }
  await audit(s.userId, "address.delete", "address", String(id));
}

export async function setDefaultAddress(id: number): Promise<void> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const [owned] = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  if (!owned) throw new Error("404");
  // single operation: clear the org's other defaults, then set this one
  await db.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.orgId, s.orgId!));
  await db
    .update(schema.addresses)
    .set({ isDefault: true })
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.orgId, s.orgId!)));
  await audit(s.userId, "address.set-default", "address", String(id));
}

/* ---------- institutional account ---------- */

export async function accountForSession(): Promise<BuyerAccount | null> {
  const s = await approvedBuyer();
  if (!s) return null;
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId!));
  if (!org) return null;
  return {
    legalName: org.legalName, orgType: org.orgType, gstin: org.gstin,
    contactName: org.contactName, contactPhone: org.contactPhone, email: org.email,
  };
}

/** Non-sensitive fields (contact name / phone) apply immediately. */
export async function updateContactDetails(input: {
  contactName: string; contactPhone: string;
}): Promise<void> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const contactName = boundedStr(input.contactName, "Contact name", 120);
  const contactPhone = boundedStr(input.contactPhone, "Contact phone", 30);
  if (!/^[0-9+()\-\s]{6,30}$/.test(contactPhone)) {
    throw new Error("400:Enter a valid contact phone number");
  }
  await db
    .update(schema.organizations)
    .set({ contactName, contactPhone })
    .where(eq(schema.organizations.id, s.orgId!));
  await audit(s.userId, "account.contact-update", "organization", String(s.orgId!), { contactName, contactPhone });
}

const SENSITIVE_FIELDS = { legalName: "Legal name", gstin: "GSTIN" } as const;
export type SensitiveField = keyof typeof SENSITIVE_FIELDS;

/** Sensitive fields (legal name / GSTIN) do NOT change the org — the request
 *  is recorded and handed to Smash Pro ops for re-review (DECIDED rule). */
export async function requestSensitiveChange(input: {
  field: SensitiveField; newValue: string; note?: string;
}): Promise<void> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const label = SENSITIVE_FIELDS[input.field];
  if (!label) throw new Error("400:Choose a valid field to change");
  const newValue = boundedStr(input.newValue, "New value", input.field === "gstin" ? 20 : 160);
  const note = typeof input.note === "string" && input.note.trim()
    ? boundedStr(input.note, "Note", 500)
    : undefined;
  // intentionally does NOT mutate the organization — re-review gate
  await audit(s.userId, "account.change-request", "organization", String(s.orgId!), {
    field: input.field, newValue, note,
  });
  await notifyAdmins(
    `${s.orgName ?? "A buyer organization"} requested a change to its ${label} — re-review required.`,
    "/admin/approvals"
  );
}

/* ---------- reorder (re-add a past order's lines to the cart) ---------- */

export async function reorderToCart(orderId: string): Promise<ReorderResult> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const [o] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.orgId, s.orgId!)));
  if (!o) throw new Error("404");
  const lines = await db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, o.id));

  let added = 0;
  const skipped: { sku: string; reason: string }[] = [];
  for (const l of lines) {
    const [p] = await db
      .select({ sku: schema.products.sku, active: schema.products.active, configurable: schema.products.configurable })
      .from(schema.products)
      .where(eq(schema.products.sku, l.sku));
    if (!p || !p.active) {
      skipped.push({ sku: l.sku, reason: "No longer available" });
      continue;
    }
    try {
      // reuse the SAME validated cart path (pricing, qty bounds and the
      // configurable-product rules all re-apply) — never a raw insert
      const qty = Math.min(MAX_LINE_QTY, Math.max(1, l.qty));
      await addCartLine(l.sku, qty, l.config ?? undefined);
      added++;
    } catch {
      skipped.push({
        sku: l.sku,
        reason: p.configurable ? "Configuration no longer available" : "Could not be re-added",
      });
    }
  }
  await audit(s.userId, "order.reorder", "order", orderId, { added, skipped: skipped.length });
  return { added, skipped };
}
