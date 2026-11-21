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

   MRP (owner-directed, 2026-11-20): unlike purchase/margin cost
   figures, MRP is a PUBLIC marketing fact — every visitor, pending
   account and buyer sees "MRP ₹X, now ₹Y" the same way std pricing
   already works. It is never cost/margin data, so it carries no
   access-boundary restriction the way `buyer` does.

   Variant grouping (ADR-0016, owner-directed, 2026-11-21): colour/
   size (ADR-0015) and groupKey are now PUBLIC — a buyer-facing Size/
   Colour picker needs them to render. `variantCount`/`variants` are
   populated by server/catalog.ts (which owns the sibling-row query),
   not by this module's per-row mapping — see listProducts/
   getProductBySku there. Every sibling in `variants` still goes
   through the SAME role-aware pricing/price-isolation as any other
   product; grouping never bypasses OBD-03.
   ============================================================ */

export interface PricedProduct {
  sku: string;
  name: string;
  cat: string;
  sub: string;
  img?: string;
  gallery?: string[];
  meta: string;
  /** standard listed price in rupees (two decimals) — this IS the visitor
   *  selling price shown to every visitor, pending account and buyer */
  std: number;
  /** MRP / cut-off price in rupees — a public marketing figure (OBD-23),
   *  not a cost or margin; present only for products entered via the
   *  cost-based Add Product form. Lets every visitor see "MRP ₹X, now ₹Y"
   *  the same way std/buyer pricing already works. */
  mrp?: number;
  /** approved-buyer applicable price — present only when priced for one */
  buyer?: number;
  configurable?: boolean;
  specs: [string, string][];
  /** ADR-0015/0016 — free-text descriptive attributes; present when set. */
  color?: string;
  size?: string;
  /** ADR-0015 amendment (ADR-0016) — current sellability, now public: a
   *  buyer picking a Size/Colour combination needs to know if THAT specific
   *  combination is in stock. Unlike HSN/GST/MSP/supplier code (which stay
   *  admin-only cost/tax data), in-stock status is an ordinary availability
   *  fact, same posture as the pre-existing `active` gate. */
  inStock?: boolean;
  /** ADR-0016 — buyer-facing variant grouping key; present only when this
   *  SKU is grouped with sibling colour/size variants. */
  groupKey?: string;
  /** ADR-0016 — set ONLY on the representative row a listing/search/
   *  related-products query returns for a group (server/catalog.ts); the
   *  count of active variants in the group, so a card can show "N options". */
  variantCount?: number;
  /** ADR-0016 — set ONLY by getProductBySku (the product detail page) when
   *  this SKU belongs to a group: every ACTIVE sibling in the group
   *  (including this SKU itself), each already fully role-aware-priced,
   *  for an instant client-side Size/Colour picker with no extra fetch. */
  variants?: PricedProduct[];
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
    mrp: p.mrpPaise !== null ? toRupees(p.mrpPaise) : undefined,
    configurable: p.configurable || undefined,
    specs: p.specs,
    color: p.color ?? undefined,
    size: p.size ?? undefined,
    inStock: p.inStock,
    groupKey: p.groupKey ?? undefined,
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
