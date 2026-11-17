import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, getSession, type SessionUser } from "@/server/auth";
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
      from: m.fromRole as "prosmash" | "you" | "system", meta: m.meta, text: m.body,
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
    pos: pos.filter((x) => x.f === "acknowledged" || x.f === "awaiting-proof").length,
  };
}
