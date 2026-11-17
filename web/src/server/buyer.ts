import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, type SessionUser } from "@/server/auth";
import { applyDiscountPaise, discountBpFor } from "@/server/pricing";
import { RACQUET_OPTIONS } from "@/data/products";
import type { BuyerRequest, Institution, Order, RacquetConfig } from "@/lib/types";

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
}

const DEMO_SHIPPING_PAISE = 120000;

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
  for (const l of lines) {
    const [p] = await db.select().from(schema.products).where(eq(schema.products.sku, l.sku));
    if (!p) continue;
    const bp = await discountBpFor(s.orgId!, p.catSlug, p.sku);
    const unitPaise = applyDiscountPaise(p.stdPaise, bp) + l.deltaPaise;
    const totalPaise = unitPaise * l.qty;
    itemsIncl += totalPaise;
    out.push({
      key: l.key, sku: l.sku, qty: l.qty, config: l.config ?? null, delta: r(l.deltaPaise),
      name: p.name, img: p.img ?? undefined, unit: r(unitPaise), total: r(totalPaise),
    });
  }
  const { subtotal, gst } = gstSplit(itemsIncl);
  const shipping = out.length ? DEMO_SHIPPING_PAISE : 0;
  return {
    lines: out,
    count: out.reduce((s2, l) => s2 + l.qty, 0),
    itemsIncl: r(itemsIncl),
    subtotalExGst: r(subtotal),
    gst: r(gst),
    shipping: r(shipping),
    total: r(itemsIncl + shipping),
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
}): Promise<{ orderId: string; paymentStatus: string }> {
  const s = await approvedBuyer();
  if (!s) throw new Error("401");
  const cart = await cartForSession();
  if (!cart || cart.lines.length === 0) throw new Error("cart-empty");
  // technical processing bound (integer-paise storage), not a business rule
  if (cart.total > 19_000_000) {
    throw new Error("400:Order total is too large to process in one order — please split it");
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
  await audit(s.userId, "order.create", "order", orderId, { method: input.method, total: cart.total });
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
