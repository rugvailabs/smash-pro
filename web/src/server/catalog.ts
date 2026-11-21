import "server-only";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";
import { priceProducts, type PricedProduct } from "@/server/pricing";
import { dedupeGroups } from "@/lib/group-products";

/* ============================================================
   Catalogue service (B2). Pricing is role-resolved here: the
   applicable (buyer) price is computed and serialised ONLY for
   an approved buyer session — price isolation at the boundary
   (OBD-03/PLT-001), not in the client.

   Variant grouping (ADR-0016): rows sharing a non-null `groupKey`
   (ADR-0015 colour/size variants of one model, e.g. a bulk-imported
   supplier stock sheet) are ONE buyer-facing listing, not N. Every
   listing/search/related-products query below collapses a group down
   to ONE representative row (dedupeGroups) before returning; the
   product detail page is the one place that instead expands a group
   out to its full sibling list, for the Size/Colour picker.
   ============================================================ */

async function buyerOrgId(): Promise<number | null> {
  const s = await getSession();
  return s && s.role === "buyer" && s.orgStatus === "active" ? s.orgId : null;
}

export async function listCategories() {
  await connection(); // live data — never prerendered at build time
  const cats = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));
  // live sample counts per category
  const prods = await db
    .select({ cat: schema.products.catSlug })
    .from(schema.products)
    .where(eq(schema.products.active, true));
  const counts = new Map<string, number>();
  for (const p of prods) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);
  return cats.map((c) => ({ slug: c.slug, name: c.name, count: counts.get(c.slug) ?? 0 }));
}

export async function listProducts(cat?: string): Promise<PricedProduct[]> {
  await connection();
  const rows = await db
    .select()
    .from(schema.products)
    .where(cat ? and(eq(schema.products.active, true), eq(schema.products.catSlug, cat)) : eq(schema.products.active, true))
    .orderBy(asc(schema.products.sku));
  const priced = await priceProducts(rows, await buyerOrgId());
  return dedupeGroups(priced);
}

export async function getProductBySku(sku: string): Promise<PricedProduct | undefined> {
  await connection();
  const [row] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  if (!row || !row.active) return undefined;
  const orgId = await buyerOrgId();
  const [priced] = await priceProducts([row], orgId);
  // ADR-0016: grouped → attach every ACTIVE sibling variant (incl. this
  // SKU), already fully priced, so the Size/Colour picker needs no
  // further fetch when a buyer switches selection client-side.
  if (row.groupKey) {
    const siblingRows = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.groupKey, row.groupKey), eq(schema.products.active, true)))
      .orderBy(asc(schema.products.sku));
    priced.variants = await priceProducts(siblingRows, orgId);
  }
  return priced;
}

export async function searchCatalog(q: string): Promise<PricedProduct[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  await connection();
  const rows = await db.select().from(schema.products).where(eq(schema.products.active, true));
  const hits = rows.filter((p) =>
    `${p.name} ${p.sub} ${p.catSlug} ${p.sku}`.toLowerCase().includes(needle)
  );
  const priced = await priceProducts(hits, await buyerOrgId());
  return dedupeGroups(priced);
}

export async function relatedProducts(sku: string, limit = 4): Promise<PricedProduct[]> {
  await connection();
  const [current] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  if (!current) return [];
  const rows = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.active, true), eq(schema.products.catSlug, current.catSlug)))
    .orderBy(asc(schema.products.sku));
  // exclude every sibling of the CURRENT group too, not just the current sku
  // itself — otherwise "often procured together" would recommend the same
  // model's other sizes/colours back to the buyer already viewing it.
  const others = rows.filter((p) =>
    current.groupKey ? p.groupKey !== current.groupKey : p.sku !== sku
  );
  const priced = await priceProducts(others, await buyerOrgId());
  return dedupeGroups(priced).slice(0, limit);
}

export interface SuggestionDto {
  group: "Products" | "Categories" | "Reference IDs";
  label: string;
  meta?: string;
  href: string;
}

/** Suggestions (library §3): products + categories; a signed-in approved
 *  buyer additionally gets their own order ids. No prices in suggestions. */
export async function suggestFor(q: string): Promise<SuggestionDto[]> {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  await connection();
  const out: SuggestionDto[] = [];

  const prods = await db
    .select({
      sku: schema.products.sku, name: schema.products.name, sub: schema.products.sub,
      groupKey: schema.products.groupKey,
    })
    .from(schema.products)
    .where(eq(schema.products.active, true));
  // ADR-0016: one suggestion per group — don't list the same model's every
  // colour/size as a separate "product" suggestion. Only mark a group seen
  // once one of its variants actually matches and gets pushed, so a
  // non-matching first variant never hides a later matching sibling.
  const seenGroups = new Set<string>();
  for (const p of prods) {
    if (p.groupKey && seenGroups.has(p.groupKey)) continue;
    if (`${p.name} ${p.sub} ${p.sku}`.toLowerCase().includes(needle)) {
      out.push({ group: "Products", label: p.name, meta: p.sku, href: `/product/${p.sku}` });
      if (p.groupKey) seenGroups.add(p.groupKey);
      if (out.length >= 4) break;
    }
  }

  const cats = await listCategories();
  let c = 0;
  for (const cat of cats) {
    if (cat.name.toLowerCase().includes(needle)) {
      out.push({ group: "Categories", label: cat.name, meta: `${cat.count} products`, href: `/catalog?cat=${cat.slug}` });
      if (++c >= 4) break;
    }
  }

  const s = await getSession();
  if (s && s.role === "buyer" && s.orgStatus === "active" && s.orgId !== null) {
    const orders = await db
      .select({ id: schema.orders.id, statusLabel: schema.orders.statusLabel })
      .from(schema.orders)
      .where(eq(schema.orders.orgId, s.orgId));
    let r = 0;
    for (const o of orders) {
      if (o.id.toLowerCase().includes(needle)) {
        out.push({ group: "Reference IDs", label: o.id, meta: o.statusLabel, href: `/orders/${o.id}` });
        if (++r >= 4) break;
      }
    }
  }
  return out;
}
