import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { normalizeBuyerType } from "@/lib/buyer-types";

/* ============================================================
   Pricing (OBD-05 revised): the approved-buyer discount is a
   single rate per BUYER ORGANISATION TYPE, applied uniformly to
   every product in all categories. There are no product-level or
   per-organisation override rules — the buyer's organisation type
   (resolved from the VERIFIED organisations.orgType, never client
   data) fully determines the discount.

   Discounts are basis points off the public standard listed price
   and apply BEFORE GST presentation. Prices are GST-inclusive
   paise. The applicable (buyer) price is computed SERVER-SIDE and
   serialised only for approved buyers — anonymous / pending
   responses never carry the field (price isolation at the
   boundary). One buyer's rate never reveals another's: the rate
   is keyed only by the requesting buyer's own org type.
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

export function applyDiscountPaise(stdPaise: number, bp: number): number {
  // basis points; round to whole paise (rounding method detail stays ◇ OBD-20)
  return Math.round((stdPaise * (10_000 - bp)) / 10_000);
}

/** The active buyer-category discount (basis points) for a buyer org.
 *  Resolves the org's VERIFIED type → bucket → active rate. Returns 0 when
 *  the org is unknown, or no active rate is configured for its type — an
 *  approved buyer with no configured discount simply sees the standard price.
 *  null orgId (anonymous / pending) always returns 0 and no buyer price is set. */
export async function buyerTypeDiscountBp(buyerOrgId: number | null): Promise<number> {
  if (buyerOrgId === null) return 0;
  const [org] = await db
    .select({ orgType: schema.organizations.orgType })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, buyerOrgId));
  if (!org) return 0;
  const key = normalizeBuyerType(org.orgType);
  const [rule] = await db
    .select({ discountBp: schema.buyerTypeDiscounts.discountBp })
    .from(schema.buyerTypeDiscounts)
    .where(and(eq(schema.buyerTypeDiscounts.buyerType, key), eq(schema.buyerTypeDiscounts.active, true)));
  return rule?.discountBp ?? 0;
}

function toDto(p: typeof schema.products.$inferSelect): PricedProduct {
  return {
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
}

/** Map a product row to its API shape; buyerOrgId=null → no buyer price. */
export async function priceProduct(
  p: typeof schema.products.$inferSelect,
  buyerOrgId: number | null
): Promise<PricedProduct> {
  const out = toDto(p);
  if (buyerOrgId !== null) {
    const bp = await buyerTypeDiscountBp(buyerOrgId);
    out.buyer = toRupees(applyDiscountPaise(p.stdPaise, bp));
  }
  return out;
}

/** Batch variant — resolves the buyer's single buyer-type rate ONCE, then
 *  applies it uniformly to every product (no per-SKU rule resolution). */
export async function priceProducts(
  rows: (typeof schema.products.$inferSelect)[],
  buyerOrgId: number | null
): Promise<PricedProduct[]> {
  const bp = buyerOrgId !== null ? await buyerTypeDiscountBp(buyerOrgId) : 0;
  return rows.map((p) => {
    const base = toDto(p);
    if (buyerOrgId !== null) base.buyer = toRupees(applyDiscountPaise(p.stdPaise, bp));
    return base;
  });
}
