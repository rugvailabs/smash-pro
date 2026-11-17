import "server-only";
import { sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hashPassword } from "@/server/auth";
import { CATEGORIES, PRODUCTS } from "@/data/products";
import { INSTITUTION, ORDERS, REQUESTS } from "@/data/buyer";
import {
  COST_PROPOSALS, PAYMENT_RECORDS, POS, QUOTES, REQUIREMENTS, SUPPLIER, SUPPLY_ITEMS,
} from "@/data/supplier";

/* ============================================================
   Seed: ports the reviewed illustrative sample data into Neon
   so the real backend serves exactly the demo the owner approved.
   Idempotent: wipes and reinserts (dev/demo environments only).
   Demo accounts (ADR-0004): password "prosmash-demo" —
     buyer@demo.prosmash.in     (St. Xavier's — approved buyer)
     supplier@demo.prosmash.in  (Meerut Sports Works — approved supplier)
     pending@demo.prosmash.in   (Model Public School — pending buyer)
     admin@demo.prosmash.in     (ProSmash operations)
   ============================================================ */

const paise = (r: number) => Math.round(r * 100);

export async function runSeed() {
  // wipe in dependency order
  await db.execute(sql`
    TRUNCATE TABLE audit_log, notifications, complaints, product_requests,
      supplier_payment_records, cost_proposals, supply_items, delivery_proofs,
      purchase_orders, negotiation_messages, quotation_versions, quotations,
      requirements, payments, order_lines, orders, cart_lines, documents,
      addresses, price_rules, products, categories, sessions, users,
      organizations RESTART IDENTITY CASCADE
  `);

  /* categories + products */
  await db.insert(schema.categories).values(
    CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, sortOrder: i }))
  );
  await db.insert(schema.products).values(
    PRODUCTS.map((p) => ({
      sku: p.sku,
      name: p.name,
      catSlug: p.cat,
      sub: p.sub,
      img: p.img ?? null,
      gallery: p.gallery ?? null,
      meta: p.meta,
      stdPaise: paise(p.std),
      configurable: p.configurable ?? false,
      specs: p.specs,
      directShip: false,
      active: true,
    }))
  );
  // OBD-20 decided structure — illustrative 15% category-default tier
  // reproduces the approved sample buyer price (std × 0.85) exactly.
  await db.insert(schema.priceRules).values(
    CATEGORIES.map((c) => ({ scope: "category-default", catSlug: c.slug, discountPct: 1500 }))
  );

  /* organizations */
  const [buyerOrg] = await db.insert(schema.organizations).values({
    kind: "buyer", status: "active",
    name: INSTITUTION.name, legalName: INSTITUTION.legalName,
    orgType: INSTITUTION.orgType, gstin: INSTITUTION.gstin,
    contactName: INSTITUTION.contact, email: INSTITUTION.email,
    city: INSTITUTION.city, buyerCategory: INSTITUTION.buyerCategory,
  }).returning();

  // One org-product override (OBD-20 Option A top precedence): St. Xavier's
  // gets 20% on the stumps set — exercises per-SKU precedence end-to-end.
  await db.insert(schema.priceRules).values({
    scope: "org-product", orgId: buyerOrg.id, sku: "CR-0915", discountPct: 2000,
  });

  const supplierCatSlugs = ["cricket", "athletics", "gym-fitness"];
  const [supplierOrg] = await db.insert(schema.organizations).values({
    kind: "supplier", status: "active",
    name: SUPPLIER.name, legalName: SUPPLIER.legalName,
    orgType: SUPPLIER.type, gstin: SUPPLIER.gstin,
    contactName: SUPPLIER.contact, email: SUPPLIER.email,
    worksAddress: SUPPLIER.worksAddress,
    approvedCategories: supplierCatSlugs,
    directApproved: SUPPLIER.directApproved,
    directEnabled: SUPPLIER.directEnabled,
  }).returning();

  const [pendingOrg] = await db.insert(schema.organizations).values({
    kind: "buyer", status: "pending",
    name: "Model Public School", legalName: "Model Public School Trust",
    orgType: "School", city: "Nagpur",
    email: "office@modelpublic.example", buyerCategory: "School",
  }).returning();

  /* users (one per org — OBD-15 open) */
  const pw = await hashPassword("prosmash-demo");
  const [buyerUser] = await db.insert(schema.users).values({
    orgId: buyerOrg.id, email: "buyer@demo.prosmash.in", passwordHash: pw,
    name: "Head of Sports", role: "buyer",
  }).returning();
  await db.insert(schema.users).values({
    orgId: supplierOrg.id, email: "supplier@demo.prosmash.in", passwordHash: pw,
    name: "Sales Head", role: "supplier",
  });
  await db.insert(schema.users).values({
    orgId: pendingOrg.id, email: "pending@demo.prosmash.in", passwordHash: pw,
    name: "Office Administrator", role: "buyer",
  });
  await db.insert(schema.users).values({
    orgId: null, email: "admin@demo.prosmash.in", passwordHash: pw,
    name: "ProSmash Operations", role: "admin",
  });

  /* buyer org data */
  await db.insert(schema.addresses).values(
    INSTITUTION.addresses.map((a) => ({
      orgId: buyerOrg.id, label: a.label, detail: a.detail, isDefault: a.isDefault ?? false,
    }))
  );
  await db.insert(schema.documents).values(
    INSTITUTION.documents.map((d) => ({ orgId: buyerOrg.id, filename: d.file, state: d.state }))
  );
  await db.insert(schema.documents).values(
    SUPPLIER.documents.map((d) => ({ orgId: supplierOrg.id, filename: d.file, state: d.state }))
  );

  /* orders + lines + payments */
  for (const o of ORDERS) {
    await db.insert(schema.orders).values({
      id: o.id, orgId: buyerOrg.id, userId: buyerUser.id,
      placed: o.placed, rail: o.rail,
      status: o.status, statusLabel: o.statusLabel, direct: o.direct,
      subtotalExGstPaise: paise(o.subtotalExGst), gstPaise: paise(o.gst),
      shippingPaise: o.shipping === null ? null : paise(o.shipping),
      totalPaise: paise(o.total), shipTo: o.shipTo,
      dispatchedAt: o.dispatched ?? null, transportRef: o.transportRef ?? null,
      deliveredOn: o.deliveredOn ?? null,
      deliveryProofOnRecord: o.deliveryProofOnRecord ?? false,
      receiptConfirmed: o.receiptConfirmed ?? false,
    });
    await db.insert(schema.orderLines).values(
      o.lines.map((l) => ({
        orderId: o.id, sku: l.sku, name: l.name, unitPaise: paise(l.unit), qty: l.qty,
      }))
    );
    await db.insert(schema.payments).values({
      orderId: o.id, method: o.payment.method,
      status: o.payment.status, statusLabel: o.payment.statusLabel,
      reference: o.payment.reference ?? null,
      declaredAmountPaise: o.payment.declaredAmount ? paise(o.payment.declaredAmount) : null,
      proofFilename: o.payment.proofFile ?? null,
      proofUploadedAt: o.payment.proofUploadedAt ?? null,
      confirmedAt: o.payment.confirmedAt ?? null,
    });
  }

  /* buyer product requests */
  await db.insert(schema.productRequests).values(
    REQUESTS.map((r) => ({
      id: r.id, orgId: buyerOrg.id, title: r.title, category: r.category,
      qty: r.qty, neededBy: r.neededBy ?? null, submitted: r.submitted,
      status: r.status, statusLabel: r.statusLabel,
    }))
  );

  /* one open complaint — gives the admin complaints queue real work */
  await db.insert(schema.complaints).values({
    orderId: "ORD-2026-01132", orgId: buyerOrg.id,
    body: "Two cartons in the delivery arrived water-damaged; requesting replacement of 6 units.",
    status: "open",
  });

  /* procurement */
  const catBySupplierName: Record<string, string> = {
    Cricket: "cricket", Athletics: "athletics", "Gym & Fitness": "gym-fitness",
  };
  await db.insert(schema.requirements).values(
    REQUIREMENTS.map((r) => ({
      id: r.id, title: r.title, catSlug: catBySupplierName[r.category] ?? "cricket",
      qty: r.qty, destination: r.destination, published: r.published ?? null,
      closes: r.closes, closesToday: r.closesToday ?? false,
      status: r.status, statusLabel: r.statusLabel,
      spec: r.spec ?? null, requiredBy: r.requiredBy ?? null,
      attachments: r.attachments ?? null, poId: r.poId ?? null,
    }))
  );

  for (const q of QUOTES) {
    const [quotation] = await db.insert(schema.quotations).values({
      reqId: q.reqId, supplierOrgId: supplierOrg.id,
      status: "revision-requested", statusLabel: q.statusLabel,
    }).returning();
    // versions oldest-first so v numbers ascend
    const ordered = [...q.versions].sort((a, b) => a.v.localeCompare(b.v));
    await db.insert(schema.quotationVersions).values(
      ordered.map((v) => ({
        quotationId: quotation.id, v: Number(v.v.replace("v", "")),
        unitPaise: paise(v.unit), quantity: q.quantity, lead: q.lead,
        validTill: q.validTill, terms: q.terms, summary: v.summary, date: v.date,
        attachments: q.attachments,
      }))
    );
    await db.insert(schema.negotiationMessages).values(
      q.thread.map((m) => ({
        quotationId: quotation.id, fromRole: m.from, meta: m.meta, body: m.text,
      }))
    );
  }

  await db.insert(schema.purchaseOrders).values(
    POS.map((p) => ({
      id: p.id, supplierOrgId: supplierOrg.id, destination: p.destination,
      issued: p.issued, lineName: p.lineName, lineQty: p.lineQty,
      unitPaise: paise(p.unit), valuePaise: paise(p.value),
      fulfilment: p.fulfilment, fulfilmentLabel: p.fulfilmentLabel,
      dispatchBy: p.dispatchBy ?? null, acknowledgedAt: p.acknowledgedAt ?? null,
      dispatchedQty: p.dispatchedQty ?? null, receivedQty: p.receivedQty ?? null,
      awardedFrom: p.awardedFrom ?? null, terms: p.terms ?? null,
      paymentTerms: p.paymentTerms, receivedPaise: paise(p.received),
      outstandingPaise: paise(p.outstanding), payStatusLabel: p.payStatusLabel,
      minDeliveryInfo: p.minDeliveryInfo ?? null, shipment: p.shipment ?? null,
    }))
  );
  // PO-2026-00418 is "delivered-proof": its proof is on record
  await db.insert(schema.deliveryProofs).values({
    poId: "PO-2026-00418", filename: "pod-lr-88102-signed.jpg",
  });

  await db.insert(schema.supplyItems).values(
    SUPPLY_ITEMS.map((s) => ({
      supplierOrgId: supplierOrg.id, name: s.name, category: s.category,
      capacity: s.capacity, lead: s.lead, costPaise: paise(s.cost),
      proposal: s.proposal ?? null,
    }))
  );
  await db.insert(schema.costProposals).values(
    COST_PROPOSALS.map((c) => ({
      supplierOrgId: supplierOrg.id, title: c.title, detail: c.detail,
      statusLabel: c.statusLabel, accepted: c.accepted ?? null,
    }))
  );
  await db.insert(schema.supplierPaymentRecords).values(
    PAYMENT_RECORDS.map((r) => ({ supplierOrgId: supplierOrg.id, title: r.title, meta: r.meta }))
  );

  await db.insert(schema.auditLog).values({
    actorUserId: null, action: "seed", entity: "database", entityId: "demo",
    detail: { products: PRODUCTS.length, orders: ORDERS.length },
  });

  return {
    products: PRODUCTS.length,
    categories: CATEGORIES.length,
    orders: ORDERS.length,
    requirements: REQUIREMENTS.length,
    pos: POS.length,
  };
}
