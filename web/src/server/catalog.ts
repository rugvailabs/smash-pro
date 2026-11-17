import "server-only";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";
import { priceProducts, type PricedProduct } from "@/server/pricing";

/* ============================================================
   Catalogue service (B2). Pricing is role-resolved here: the
   applicable (buyer) price is computed and serialised ONLY for
   an approved buyer session — price isolation at the boundary
   (OBD-03/PLT-001), not in the client.
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
  return priceProducts(rows, await buyerOrgId());
}

export async function getProductBySku(sku: string): Promise<PricedProduct | undefined> {
  await connection();
  const [row] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
  if (!row || !row.active) return undefined;
  const [priced] = await priceProducts([row], await buyerOrgId());
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
  return priceProducts(hits, await buyerOrgId());
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
  return priceProducts(rows.filter((p) => p.sku !== sku).slice(0, limit), await buyerOrgId());
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
    .select({ sku: schema.products.sku, name: schema.products.name, sub: schema.products.sub })
    .from(schema.products)
    .where(eq(schema.products.active, true));
  for (const p of prods) {
    if (`${p.name} ${p.sub} ${p.sku}`.toLowerCase().includes(needle)) {
      out.push({ group: "Products", label: p.name, meta: p.sku, href: `/product/${p.sku}` });
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
