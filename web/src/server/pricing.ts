import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/server/db";

/* ============================================================
   Pricing (OBD-20 DECIDED structure): discount applied before
   GST presentation; INDIVIDUAL override beats category discount
   (Option A precedence). Prices are GST-inclusive paise.
   Applicable prices are computed SERVER-SIDE and serialised only
   for approved buyers — anonymous/pending responses never carry
   the field at all (price isolation at the boundary).
   ============================================================ */

export interface PricedProduct {
  sku: string;
  name: string;
  cat: string;
  sub: string;
  img?: string;
  gallery?: string[];
  meta: string;
  /** standard listed price in rupees (two decimals) */
  std: number;
  /** approved-buyer applicable price — present only when priced for one */
  buyer?: number;
  configurable?: boolean;
  specs: [string, string][];
}

const toRupees = (paise: number) => Math.round(paise) / 100;

/** OBD-20 Option A: org-product override > org-category > category-default. */
export async function discountBpFor(
  orgId: number | null,
  catSlug: string,
  sku: string
): Promise<number> {
  if (orgId !== null) {
    const [op] = await db
      .select()
      .from(schema.priceRules)
      .where(and(eq(schema.priceRules.scope, "org-product"), eq(schema.priceRules.orgId, orgId), eq(schema.priceRules.sku, sku)));
    if (op) return op.discountPct;
    const [oc] = await db
      .select()
      .from(schema.priceRules)
      .where(and(eq(schema.priceRules.scope, "org-category"), eq(schema.priceRules.orgId, orgId), eq(schema.priceRules.catSlug, catSlug)));
    if (oc) return oc.discountPct;
  }
  const [cd] = await db
    .select()
    .from(schema.priceRules)
    .where(and(eq(schema.priceRules.scope, "category-default"), eq(schema.priceRules.catSlug, catSlug), isNull(schema.priceRules.orgId)));
  return cd?.discountPct ?? 0;
}

export function applyDiscountPaise(stdPaise: number, bp: number): number {
  // basis points; round to whole paise (rounding method detail stays ◇ OBD-20)
  return Math.round((stdPaise * (10_000 - bp)) / 10_000);
}

/** Map a product row to its API shape; buyerOrgId=null → no buyer price. */
export async function priceProduct(
  p: typeof schema.products.$inferSelect,
  buyerOrgId: number | null
): Promise<PricedProduct> {
  const out: PricedProduct = {
    sku: p.sku,
    name: p.name,
    cat: p.catSlug,
    sub: p.sub,
    img: p.img ?? undefined,
    gallery: p.gallery ?? undefined,
    meta: p.meta,
    std: toRupees(p.stdPaise),
    configurable: p.configurable || undefined,
    specs: p.specs,
  };
  if (buyerOrgId !== null) {
    const bp = await discountBpFor(buyerOrgId, p.catSlug, p.sku);
    out.buyer = toRupees(applyDiscountPaise(p.stdPaise, bp));
  }
  return out;
}

/** Batch variant — fetches the org's full rule set once, then resolves
 *  OBD-20 Option A precedence PER PRODUCT (org-product > org-category >
 *  category-default), so per-SKU overrides never bleed across a category. */
export async function priceProducts(
  rows: (typeof schema.products.$inferSelect)[],
  buyerOrgId: number | null
): Promise<PricedProduct[]> {
  const bySku = new Map<string, number>();
  const byOrgCat = new Map<string, number>();
  const byCatDefault = new Map<string, number>();
  if (buyerOrgId !== null && rows.length) {
    const rules = await db
      .select()
      .from(schema.priceRules)
      .where(
        or(
          and(eq(schema.priceRules.orgId, buyerOrgId), eq(schema.priceRules.scope, "org-product")),
          and(eq(schema.priceRules.orgId, buyerOrgId), eq(schema.priceRules.scope, "org-category")),
          and(eq(schema.priceRules.scope, "category-default"), isNull(schema.priceRules.orgId))
        )
      );
    for (const r of rules) {
      if (r.scope === "org-product" && r.sku) bySku.set(r.sku, r.discountPct);
      else if (r.scope === "org-category" && r.catSlug) byOrgCat.set(r.catSlug, r.discountPct);
      else if (r.scope === "category-default" && r.catSlug) byCatDefault.set(r.catSlug, r.discountPct);
    }
  }
  return rows.map((p) => {
    const base: PricedProduct = {
      sku: p.sku,
      name: p.name,
      cat: p.catSlug,
      sub: p.sub,
      img: p.img ?? undefined,
      gallery: p.gallery ?? undefined,
      meta: p.meta,
      std: toRupees(p.stdPaise),
      configurable: p.configurable || undefined,
      specs: p.specs,
    };
    if (buyerOrgId !== null) {
      const bp = bySku.get(p.sku) ?? byOrgCat.get(p.catSlug) ?? byCatDefault.get(p.catSlug) ?? 0;
      base.buyer = toRupees(applyDiscountPaise(p.stdPaise, bp));
    }
    return base;
  });
}
