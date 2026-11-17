import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, type SessionUser } from "@/server/auth";
import { notifyAdmins } from "@/server/notifications";
import type {
  CostProposal, SupplierPO, SupplierProfile, SupplierQuote, SupplierRequirement, SupplyItem,
} from "@/lib/types";

/* ============================================================
   Supplier workspace service (B4). Boundary discipline is
   enforced here (PLT-001 AC2 / OBD-19): every query scopes to
   the session's supplier organization; requirements are matched
   to approved categories only; no buyer identities, no
   competing quotations, Minimum Delivery Information only.
   ============================================================ */

const r = (p: number) => Math.round(p) / 100;

/** Today as a display date — the UI-facing format used across the workspace
 *  (e.g. "02 Dec 2026"). */
const displayDate = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

async function approvedSupplier(): Promise<SessionUser | null> {
  const s = await getSession();
  return s && s.role === "supplier" && s.orgStatus === "active" && s.orgId !== null ? s : null;
}

const CAT_LABELS: Record<string, string> = {
  cricket: "Cricket", athletics: "Athletics", "gym-fitness": "Gym & Fitness",
  football: "Football", basketball: "Basketball", volleyball: "Volleyball",
  badminton: "Badminton", tennis: "Tennis", "indoor-games": "Indoor Games",
  "outdoor-games": "Outdoor Games", sportswear: "Sportswear", accessories: "Accessories",
};

const CAT_LABEL_SET = new Set(Object.values(CAT_LABELS));

/** Accept either a catalogue slug or its display label; store the label
 *  (supply items carry display-label categories). Returns null if neither. */
function normalizeCategory(input: string): string | null {
  const t = input.trim();
  if (CAT_LABELS[t]) return CAT_LABELS[t];
  if (CAT_LABEL_SET.has(t)) return t;
  return null;
}

const COST_MAX_PAISE = 1_000_000_000; // ₹1,00,00,000 cap (technical bound)

function toCostPaise(cost: unknown): number {
  if (typeof cost !== "number" || !Number.isFinite(cost) || cost <= 0) {
    throw new Error("400:Cost must be a positive amount in rupees");
  }
  const paise = Math.round(cost * 100);
  if (paise <= 0) throw new Error("400:Cost must be at least ₹0.01");
  if (paise > COST_MAX_PAISE) throw new Error("400:Cost must not exceed ₹1,00,00,000");
  return paise;
}

export async function profileForSession(): Promise<SupplierProfile | null> {
  const s = await approvedSupplier();
  if (!s) return null;
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId!));
  if (!org) return null;
  const docs = await db.select().from(schema.documents).where(eq(schema.documents.orgId, org.id));
  return {
    name: org.name, legalName: org.legalName, type: org.orgType, gstin: org.gstin,
    contact: org.contactName, email: org.email, worksAddress: org.worksAddress,
    categories: (org.approvedCategories ?? []).map((c) => CAT_LABELS[c] ?? c),
    documents: docs.map((d) => ({ file: d.filename, state: d.state })),
    directApproved: org.directApproved,
    directEnabled: org.directEnabled ?? [],
  };
}

export async function requirementsForSession(): Promise<SupplierRequirement[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId!));
  const cats = org?.approvedCategories ?? [];
  const rows = await db.select().from(schema.requirements).orderBy(desc(schema.requirements.id));
  return rows
    .filter((x) => cats.includes(x.catSlug))
    .map((x) => ({
      id: x.id, title: x.title, category: CAT_LABELS[x.catSlug] ?? x.catSlug,
      qty: x.qty, destination: x.destination,
      published: x.published ?? undefined, closes: x.closes,
      closesToday: x.closesToday || undefined,
      status: x.status as SupplierRequirement["status"], statusLabel: x.statusLabel,
      spec: x.spec ?? undefined, requiredBy: x.requiredBy ?? undefined,
      attachments: x.attachments ?? undefined, poId: x.poId ?? undefined,
    }));
}

export async function requirementForSession(id: string): Promise<SupplierRequirement | undefined> {
  const all = await requirementsForSession();
  return all.find((x) => x.id === id);
}

async function composeQuote(
  q: typeof schema.quotations.$inferSelect
): Promise<SupplierQuote | undefined> {
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, q.reqId));
  if (!req) return undefined;
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
  const cur = versions[0];
  if (!cur) return undefined;
  return {
    reqId: q.reqId, title: req.title, category: CAT_LABELS[req.catSlug] ?? req.catSlug,
    qty: req.qty, closes: req.closes, statusLabel: q.statusLabel,
    unit: r(cur.unitPaise), quantity: cur.quantity, lead: cur.lead,
    validTill: cur.validTill, terms: cur.terms, attachments: cur.attachments,
    versions: versions.map((v, i) => ({
      v: `v${v.v}`, unit: r(v.unitPaise), summary: v.summary, date: v.date,
      current: i === 0 || undefined,
    })),
    thread: msgs.map((m) => ({
      from: m.fromRole as "smash pro" | "you" | "system", meta: m.meta, text: m.body,
    })),
  };
}

export async function quotesForSession(): Promise<SupplierQuote[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.quotations)
    .where(eq(schema.quotations.supplierOrgId, s.orgId!))
    .orderBy(desc(schema.quotations.id));
  const out: SupplierQuote[] = [];
  for (const q of rows) {
    const composed = await composeQuote(q);
    if (composed) out.push(composed);
  }
  return out;
}

export async function quoteForSession(reqId: string): Promise<SupplierQuote | undefined> {
  const s = await approvedSupplier();
  if (!s) return undefined;
  const [q] = await db
    .select()
    .from(schema.quotations)
    .where(and(eq(schema.quotations.reqId, reqId), eq(schema.quotations.supplierOrgId, s.orgId!)));
  if (!q) return undefined;
  return composeQuote(q);
}

/** Workflow E: first submission creates v1; later submissions append an
 *  immutable new version (revisions never overwrite). */
export async function submitQuotation(input: {
  reqId: string; unit: number; quantity: string; lead: string;
  validTill: string; terms: string; note?: string;
}): Promise<{ version: number }> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const req = await requirementForSession(input.reqId);
  if (!req) throw new Error("404"); // not matched to this supplier's categories
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  let [q] = await db
    .select()
    .from(schema.quotations)
    .where(and(eq(schema.quotations.reqId, input.reqId), eq(schema.quotations.supplierOrgId, s.orgId!)));
  if (!q) {
    [q] = await db
      .insert(schema.quotations)
      .values({ reqId: input.reqId, supplierOrgId: s.orgId!, status: "submitted", statusLabel: "Submitted" })
      .returning();
  } else {
    await db
      .update(schema.quotations)
      .set({ status: "submitted", statusLabel: "Submitted" })
      .where(eq(schema.quotations.id, q.id));
  }
  const versions = await db
    .select()
    .from(schema.quotationVersions)
    .where(eq(schema.quotationVersions.quotationId, q.id))
    .orderBy(desc(schema.quotationVersions.v));
  const v = (versions[0]?.v ?? 0) + 1;
  await db.insert(schema.quotationVersions).values({
    quotationId: q.id, v, unitPaise: Math.round(input.unit * 100),
    quantity: input.quantity, lead: input.lead, validTill: input.validTill,
    terms: input.terms, summary: input.note || (v === 1 ? "initial submission" : "revision"),
    date, attachments: 0,
  });
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "system", meta: "",
    body: `Quotation v${v} submitted · ${date}`,
  });
  await db
    .update(schema.requirements)
    .set({ status: "quoted-revision", statusLabel: "Quoted · under review" })
    .where(eq(schema.requirements.id, input.reqId));
  await audit(s.userId, "quotation.submit", "quotation", `${input.reqId}#v${v}`);
  return { version: v };
}

export async function sendNegotiationMessage(reqId: string, text: string) {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [q] = await db
    .select()
    .from(schema.quotations)
    .where(and(eq(schema.quotations.reqId, reqId), eq(schema.quotations.supplierOrgId, s.orgId!)));
  if (!q) throw new Error("404");
  const now = new Date();
  const meta = `YOU · ${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "you", meta, body: text,
  });
  await audit(s.userId, "negotiation.message", "quotation", reqId);
}

/* ---------- purchase orders (SUP-009 / OBD-19) ---------- */

function composePo(p: typeof schema.purchaseOrders.$inferSelect): SupplierPO {
  return {
    id: p.id, destination: p.destination as SupplierPO["destination"], issued: p.issued,
    lineName: p.lineName, lineQty: p.lineQty, unit: r(p.unitPaise), value: r(p.valuePaise),
    fulfilment: p.fulfilment as SupplierPO["fulfilment"], fulfilmentLabel: p.fulfilmentLabel,
    dispatchBy: p.dispatchBy ?? undefined, acknowledgedAt: p.acknowledgedAt ?? undefined,
    dispatchedQty: p.dispatchedQty ?? undefined, receivedQty: p.receivedQty ?? undefined,
    awardedFrom: p.awardedFrom ?? undefined, terms: p.terms ?? undefined,
    paymentTerms: p.paymentTerms, received: r(p.receivedPaise),
    outstanding: r(p.outstandingPaise), payStatusLabel: p.payStatusLabel,
    minDeliveryInfo: p.minDeliveryInfo ?? undefined, shipment: p.shipment ?? undefined,
  };
}

export async function posForSession(): Promise<SupplierPO[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.supplierOrgId, s.orgId!))
    .orderBy(desc(schema.purchaseOrders.id));
  return rows.map(composePo);
}

export async function poForSession(id: string): Promise<SupplierPO | undefined> {
  const s = await approvedSupplier();
  if (!s) return undefined;
  const [p] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, id), eq(schema.purchaseOrders.supplierOrgId, s.orgId!)));
  return p ? composePo(p) : undefined;
}

/** OBD-19 proof-first sequence: proof upload (metadata, ADR-0005) flips the
 *  PO to delivered-proof; the recipient confirmation is requested after. */
export async function uploadDeliveryProof(poId: string, filename: string) {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [p] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.supplierOrgId, s.orgId!)));
  if (!p || p.destination !== "direct" || p.fulfilment !== "awaiting-proof") throw new Error("404");
  await db.insert(schema.deliveryProofs).values({ poId, filename });
  await db
    .update(schema.purchaseOrders)
    .set({ fulfilment: "delivered-proof", fulfilmentLabel: "Delivered · proof on record" })
    .where(eq(schema.purchaseOrders.id, poId));
  await audit(s.userId, "po.proof", "purchase_order", poId, { filename });
}

/* ---------- catalogue & money ---------- */

export async function supplyItemsForSession(): Promise<SupplyItem[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.supplyItems)
    .where(eq(schema.supplyItems.supplierOrgId, s.orgId!))
    .orderBy(asc(schema.supplyItems.id));
  return rows.map((x) => ({
    name: x.name, category: x.category, capacity: x.capacity, lead: x.lead,
    cost: r(x.costPaise), proposal: x.proposal ?? undefined,
  }));
}

export async function costProposalsForSession(): Promise<CostProposal[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.costProposals)
    .where(eq(schema.costProposals.supplierOrgId, s.orgId!))
    .orderBy(asc(schema.costProposals.id));
  return rows.map((x) => ({
    title: x.title, detail: x.detail, statusLabel: x.statusLabel,
    accepted: x.accepted ?? undefined,
  }));
}

export async function paymentRecordsForSession() {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.supplierPaymentRecords)
    .where(eq(schema.supplierPaymentRecords.supplierOrgId, s.orgId!))
    .orderBy(asc(schema.supplierPaymentRecords.id));
  return rows.map((x) => ({ title: x.title, meta: x.meta }));
}

/** Nav counts for the workspace shell (passed from the server layout). */
export async function workspaceCountsForSession() {
  const s = await approvedSupplier();
  if (!s) return null;
  const reqs = await requirementsForSession();
  const quotes = await db
    .select({ id: schema.quotations.id })
    .from(schema.quotations)
    .where(eq(schema.quotations.supplierOrgId, s.orgId!));
  const pos = await db
    .select({ f: schema.purchaseOrders.fulfilment })
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.supplierOrgId, s.orgId!));
  return {
    requirements: reqs.filter((x) => x.status === "open" || x.status === "quoted-revision").length,
    quotations: quotes.length,
    pos: pos.filter((x) => x.f === "issued" || x.f === "acknowledged" || x.f === "awaiting-proof").length,
  };
}

/* ============================================================
   PO fulfilment lifecycle — supplier side (shared contract).
   issued → acknowledged → (direct) awaiting-proof → delivered-proof
   → closed (admin). Warehouse: acknowledged → closed (admin).
   Every transition is strictly org-scoped.
   ============================================================ */

/** issued → acknowledged. Supplier accepts the PO. */
export async function acknowledgePo(poId: string): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [p] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.supplierOrgId, s.orgId!)));
  if (!p) throw new Error("404");
  if (p.fulfilment !== "issued") throw new Error("409");
  await db
    .update(schema.purchaseOrders)
    .set({ fulfilment: "acknowledged", fulfilmentLabel: "Acknowledged", acknowledgedAt: displayDate() })
    .where(eq(schema.purchaseOrders.id, poId));
  await notifyAdmins(`${s.orgName ?? "Supplier"} acknowledged ${poId}.`, "/admin/pos");
  await audit(s.userId, "po.acknowledge", "purchase_order", poId);
}

/** acknowledged → awaiting-proof (DIRECT POs only). Records dispatch /
 *  delivery-scheduling details — replaces the dispatch prototype. */
export async function recordDispatch(
  poId: string,
  input: { dispatched: string; lr: string; qtyShipped: string }
): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const dispatched = input.dispatched?.trim();
  const lr = input.lr?.trim();
  const qtyShipped = input.qtyShipped?.trim();
  if (!dispatched || !lr || !qtyShipped) throw new Error("400:Dispatch date, LR number and quantity shipped are all required");
  const [p] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.supplierOrgId, s.orgId!)));
  if (!p) throw new Error("404");
  if (p.destination !== "direct") throw new Error("409");
  if (p.fulfilment !== "acknowledged") throw new Error("409");
  await db
    .update(schema.purchaseOrders)
    .set({
      fulfilment: "awaiting-proof",
      fulfilmentLabel: "Awaiting delivery proof",
      shipment: { dispatched, lr, qtyShipped },
      dispatchedQty: qtyShipped,
    })
    .where(eq(schema.purchaseOrders.id, poId));
  await notifyAdmins(`${s.orgName ?? "Supplier"} recorded dispatch on ${poId} (LR ${lr}).`, "/admin/pos");
  await audit(s.userId, "po.dispatch", "purchase_order", poId, { dispatched, lr, qtyShipped });
}

/* ============================================================
   Product availability management (supplyItems.available) and
   the supplier catalogue. Cost is sourcing information for the
   Smash Pro team only — never a buyer-facing price (OBD-04/20).
   ============================================================ */

export interface SupplierCatalogItem extends SupplyItem {
  id: number;
  available: boolean;
}

export async function catalogItemsForSession(): Promise<SupplierCatalogItem[]> {
  const s = await approvedSupplier();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.supplyItems)
    .where(eq(schema.supplyItems.supplierOrgId, s.orgId!))
    .orderBy(asc(schema.supplyItems.id));
  return rows.map((x) => ({
    id: x.id, name: x.name, category: x.category, capacity: x.capacity, lead: x.lead,
    cost: r(x.costPaise), proposal: x.proposal ?? undefined, available: x.available,
  }));
}

export async function addSupplyItem(input: {
  name: string; category: string; capacity: string; lead: string; cost: number;
}): Promise<{ id: number }> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const name = input.name?.trim();
  if (!name) throw new Error("400:Item name is required");
  if (name.length > 200) throw new Error("400:Item name is too long");
  const category = normalizeCategory(input.category ?? "");
  if (!category) throw new Error("400:Category must be one of your approved catalogue categories");
  const costPaise = toCostPaise(input.cost);
  const capacity = (input.capacity ?? "").trim();
  const lead = (input.lead ?? "").trim();
  if (capacity.length > 120 || lead.length > 120) throw new Error("400:Capacity or lead time is too long");
  const [row] = await db
    .insert(schema.supplyItems)
    .values({ supplierOrgId: s.orgId!, name, category, capacity, lead, costPaise, available: true })
    .returning({ id: schema.supplyItems.id });
  await audit(s.userId, "supply-item.add", "supply_item", String(row.id), { name, category });
  return { id: row.id };
}

export async function updateSupplyItem(
  id: number,
  input: { name?: string; category?: string; capacity?: string; lead?: string; cost?: number }
): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [item] = await db
    .select()
    .from(schema.supplyItems)
    .where(and(eq(schema.supplyItems.id, id), eq(schema.supplyItems.supplierOrgId, s.orgId!)));
  if (!item) throw new Error("404");
  const patch: Partial<typeof schema.supplyItems.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("400:Item name is required");
    if (name.length > 200) throw new Error("400:Item name is too long");
    patch.name = name;
  }
  if (input.category !== undefined) {
    const category = normalizeCategory(input.category);
    if (!category) throw new Error("400:Category must be one of your approved catalogue categories");
    patch.category = category;
  }
  if (input.capacity !== undefined) {
    if (input.capacity.length > 120) throw new Error("400:Capacity is too long");
    patch.capacity = input.capacity.trim();
  }
  if (input.lead !== undefined) {
    if (input.lead.length > 120) throw new Error("400:Lead time is too long");
    patch.lead = input.lead.trim();
  }
  if (input.cost !== undefined) patch.costPaise = toCostPaise(input.cost);
  if (Object.keys(patch).length === 0) throw new Error("400:Nothing to update");
  await db.update(schema.supplyItems).set(patch).where(eq(schema.supplyItems.id, id));
  await audit(s.userId, "supply-item.update", "supply_item", String(id), patch);
}

export async function setSupplyItemAvailability(id: number, available: boolean): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [item] = await db
    .select()
    .from(schema.supplyItems)
    .where(and(eq(schema.supplyItems.id, id), eq(schema.supplyItems.supplierOrgId, s.orgId!)));
  if (!item) throw new Error("404");
  await db.update(schema.supplyItems).set({ available }).where(eq(schema.supplyItems.id, id));
  await audit(s.userId, "supply-item.availability", "supply_item", String(id), { available });
}

/* ============================================================
   Quotation revision + withdrawal (Workflow E). Revisions are
   immutable new versions — existing version rows are never
   updated.
   ============================================================ */

export async function submitRevision(
  reqId: string,
  input: { unit: number; quantity: string; lead: string; validTill: string; terms: string; note?: string }
): Promise<{ version: number }> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [q] = await db
    .select()
    .from(schema.quotations)
    .where(and(eq(schema.quotations.reqId, reqId), eq(schema.quotations.supplierOrgId, s.orgId!)));
  if (!q) throw new Error("404");
  if (q.status === "awarded" || q.status === "closed" || q.status === "withdrawn") throw new Error("409");
  const [req] = await db.select().from(schema.requirements).where(eq(schema.requirements.id, reqId));
  if (!req) throw new Error("404");
  if (req.status !== "open" && req.status !== "quoted-revision") throw new Error("409");
  if (typeof input.unit !== "number" || !Number.isFinite(input.unit) || input.unit <= 0) {
    throw new Error("400:Unit price must be a positive amount in rupees");
  }
  const date = displayDate();
  const versions = await db
    .select()
    .from(schema.quotationVersions)
    .where(eq(schema.quotationVersions.quotationId, q.id))
    .orderBy(desc(schema.quotationVersions.v));
  const v = (versions[0]?.v ?? 0) + 1;
  await db.insert(schema.quotationVersions).values({
    quotationId: q.id, v, unitPaise: Math.round(input.unit * 100),
    quantity: input.quantity, lead: input.lead, validTill: input.validTill,
    terms: input.terms, summary: input.note || "revision", date, attachments: 0,
  });
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "system", meta: "",
    body: `Quotation v${v} submitted (revision) · ${date}`,
  });
  await db
    .update(schema.quotations)
    .set({ status: "submitted", statusLabel: "Submitted" })
    .where(eq(schema.quotations.id, q.id));
  await db
    .update(schema.requirements)
    .set({ status: "quoted-revision", statusLabel: "Quoted · under review" })
    .where(eq(schema.requirements.id, reqId));
  await notifyAdmins(`${s.orgName ?? "Supplier"} revised their quotation on ${reqId} (v${v}).`, "/admin/sourcing");
  await audit(s.userId, "quotation.revise", "quotation", `${reqId}#v${v}`);
  return { version: v };
}

export async function withdrawQuotation(reqId: string): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const [q] = await db
    .select()
    .from(schema.quotations)
    .where(and(eq(schema.quotations.reqId, reqId), eq(schema.quotations.supplierOrgId, s.orgId!)));
  if (!q) throw new Error("404");
  if (q.status === "awarded" || q.status === "closed" || q.status === "withdrawn") throw new Error("409");
  const date = displayDate();
  await db
    .update(schema.quotations)
    .set({ status: "withdrawn", statusLabel: "Withdrawn" })
    .where(eq(schema.quotations.id, q.id));
  await db.insert(schema.negotiationMessages).values({
    quotationId: q.id, fromRole: "system", meta: "",
    body: `Quotation withdrawn by supplier · ${date}`,
  });
  await notifyAdmins(`${s.orgName ?? "Supplier"} withdrew their quotation on ${reqId}.`, "/admin/sourcing");
  await audit(s.userId, "quotation.withdraw", "quotation", reqId);
}

/* ============================================================
   Cost-change proposal submission (costProposals). A proposal is
   a record for the Smash Pro sourcing team — it takes effect only
   on Super Admin acceptance and never changes selling prices.
   ============================================================ */

export async function submitCostProposal(input: { title: string; detail: string }): Promise<{ id: number }> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const title = input.title?.trim();
  const detail = input.detail?.trim();
  if (!title) throw new Error("400:A title is required");
  if (!detail) throw new Error("400:A description of the change is required");
  if (title.length > 200) throw new Error("400:Title is too long");
  if (detail.length > 1000) throw new Error("400:Description is too long");
  const [row] = await db
    .insert(schema.costProposals)
    .values({ supplierOrgId: s.orgId!, title, detail, statusLabel: "Submitted for review", accepted: null })
    .returning({ id: schema.costProposals.id });
  await notifyAdmins(`${s.orgName ?? "Supplier"} submitted a cost-change proposal: ${title}.`, "/admin/catalog");
  await audit(s.userId, "cost-proposal.submit", "cost_proposal", String(row.id), { title });
  return { id: row.id };
}

/* ============================================================
   Supplier profile edits (SUP-003). Contact details apply
   directly; category changes and sensitive-field changes
   (legal name / GSTIN / bank) are RECORDED and routed to admin
   re-review — never applied here (OBD-19 Option C).
   ============================================================ */

export async function updateSupplierContact(input: { contactName: string; contactPhone: string }): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const contactName = input.contactName?.trim();
  const contactPhone = input.contactPhone?.trim();
  if (!contactName) throw new Error("400:Contact name is required");
  if (contactName.length > 200) throw new Error("400:Contact name is too long");
  if (contactPhone.length > 40) throw new Error("400:Contact phone is too long");
  await db
    .update(schema.organizations)
    .set({ contactName, contactPhone })
    .where(eq(schema.organizations.id, s.orgId!));
  await audit(s.userId, "profile.contact", "organization", String(s.orgId!), { contactName, contactPhone });
}

export async function requestCategoryChange(input: { categories: string[]; note?: string }): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const categories = (input.categories ?? []).map((c) => c.trim()).filter(Boolean);
  if (categories.length === 0) throw new Error("400:Select at least one category");
  const normalized = categories.map(normalizeCategory);
  if (normalized.some((c) => c === null)) throw new Error("400:One or more categories are not recognised");
  const note = (input.note ?? "").trim();
  if (note.length > 1000) throw new Error("400:Note is too long");
  const wanted = (normalized as string[]).join(", ");
  await notifyAdmins(
    `${s.orgName ?? "Supplier"} requested a category change: ${wanted}.`,
    "/admin/approvals"
  );
  await audit(s.userId, "profile.category-change", "organization", String(s.orgId!), {
    categories: normalized, note: note || undefined,
  });
}

const SENSITIVE_FIELDS: Record<string, string> = {
  legalName: "Legal name", gstin: "GSTIN", bank: "Bank details",
};

export async function requestSensitiveChange(input: {
  field: string; newValue: string; note?: string;
}): Promise<void> {
  const s = await approvedSupplier();
  if (!s) throw new Error("401");
  const label = SENSITIVE_FIELDS[input.field];
  if (!label) throw new Error("400:That field cannot be changed here");
  const newValue = input.newValue?.trim();
  if (!newValue) throw new Error("400:A new value is required");
  if (newValue.length > 300) throw new Error("400:Value is too long");
  const note = (input.note ?? "").trim();
  if (note.length > 1000) throw new Error("400:Note is too long");
  await notifyAdmins(
    `${s.orgName ?? "Supplier"} requested a change to ${label} (re-review required).`,
    "/admin/approvals"
  );
  await audit(s.userId, "profile.sensitive-change", "organization", String(s.orgId!), {
    field: input.field, newValue, note: note || undefined,
  });
}

/* ============================================================
   Supplier reporting (PLT-001 — derived from the supplier's own
   rows only; never references other suppliers or buyers).
   Commission / settlement remain OBD-14/21 and are NOT reported.
   ============================================================ */

const PO_STATE_LABELS: [string, string][] = [
  ["issued", "Issued · awaiting acknowledgement"],
  ["acknowledged", "Acknowledged"],
  ["awaiting-proof", "Awaiting delivery proof"],
  ["delivered-proof", "Delivered · proof on record"],
  ["closed", "Closed"],
];

export interface SupplierReport {
  quotations: { total: number; awarded: number; notSelected: number; withdrawn: number; winRatePct: number };
  pos: { byState: { state: string; label: string; count: number }[]; count: number; totalValue: number };
  money: { poValue: number; received: number; outstanding: number; paymentRecords: number };
  requirementsMatched: number;
}

export async function supplierReportForSession(): Promise<SupplierReport | null> {
  const s = await approvedSupplier();
  if (!s) return null;

  const quotes = await db
    .select({ status: schema.quotations.status })
    .from(schema.quotations)
    .where(eq(schema.quotations.supplierOrgId, s.orgId!));
  const total = quotes.length;
  const awarded = quotes.filter((q) => q.status === "awarded").length;
  const notSelected = quotes.filter((q) => q.status === "closed").length;
  const withdrawn = quotes.filter((q) => q.status === "withdrawn").length;
  const decided = awarded + notSelected;
  const winRatePct = decided > 0 ? Math.round((awarded / decided) * 100) : 0;

  const pos = await db
    .select({
      fulfilment: schema.purchaseOrders.fulfilment,
      valuePaise: schema.purchaseOrders.valuePaise,
      receivedPaise: schema.purchaseOrders.receivedPaise,
      outstandingPaise: schema.purchaseOrders.outstandingPaise,
    })
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.supplierOrgId, s.orgId!));
  const byState = PO_STATE_LABELS.map(([state, label]) => ({
    state, label, count: pos.filter((p) => p.fulfilment === state).length,
  }));
  const poValuePaise = pos.reduce((sum, p) => sum + p.valuePaise, 0);
  const receivedPaise = pos.reduce((sum, p) => sum + p.receivedPaise, 0);
  const outstandingPaise = pos.reduce((sum, p) => sum + p.outstandingPaise, 0);

  const payRecords = await db
    .select({ id: schema.supplierPaymentRecords.id })
    .from(schema.supplierPaymentRecords)
    .where(eq(schema.supplierPaymentRecords.supplierOrgId, s.orgId!));

  const reqs = await requirementsForSession();

  return {
    quotations: { total, awarded, notSelected, withdrawn, winRatePct },
    pos: { byState, count: pos.length, totalValue: r(poValuePaise) },
    money: {
      poValue: r(poValuePaise), received: r(receivedPaise),
      outstanding: r(outstandingPaise), paymentRecords: payRecords.length,
    },
    requirementsMatched: reqs.length,
  };
}
