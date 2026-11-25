import type { Category, Product } from "@/lib/types";
import {
  getProductBySku, listCategories, listProducts, relatedProducts, searchCatalog,
} from "@/server/catalog";

/** API BOUNDARY — now backed by the real backend (integration point I2).
 *  Signatures are unchanged from the preview phase; bodies call the
 *  server catalogue service, which computes role-aware pricing from the
 *  session (applicable prices serialise only for approved buyers).
 *  NOTE: server-only — importing this from a client component fails the
 *  build by design (price isolation lives behind this boundary). */

export async function getCategories(): Promise<Category[]> {
  return listCategories();
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const cats = await listCategories();
  return cats.find((c) => c.slug === slug);
}

export async function getProducts(cat?: string): Promise<Product[]> {
  return (await listProducts(cat)) as Product[];
}

export async function getProduct(sku: string): Promise<Product | undefined> {
  return (await getProductBySku(sku)) as Product | undefined;
}

export async function searchProducts(q: string): Promise<Product[]> {
  return (await searchCatalog(q)) as Product[];
}

const MERCHANDISE_ROW_SIZE = 5;

/** Resolves a curated SKU list, then backfills from the live active
 *  catalogue (never invented data — real, currently-sold products only)
 *  up to `target` so a few stale/retired picks never collapse a
 *  merchandising row down to one lonely card. `exclude` keeps a second
 *  row (e.g. Recommended) from repeating whatever the first row already
 *  showed. Order is preserved: curated hits first, backfill after. */
async function curatedRow(picks: string[], target: number, exclude: string[] = []): Promise<Product[]> {
  const seen = new Set(exclude);
  const out: Product[] = [];
  for (const sku of picks) {
    if (seen.has(sku)) continue;
    const p = await getProductBySku(sku);
    if (p) {
      out.push(p as Product);
      seen.add(sku);
    }
  }
  if (out.length < target) {
    const pool = await listProducts();
    for (const p of pool) {
      if (out.length >= target) break;
      if (seen.has(p.sku)) continue;
      out.push(p as Product);
      seen.add(p.sku);
    }
  }
  return out;
}

export async function getFeatured(): Promise<Product[]> {
  const picks = ["CR-0417", "BD-2001", "BB-0101", "SW-3001"];
  return curatedRow(picks, MERCHANDISE_ROW_SIZE);
}

/** A second curated real-SKU row, distinct from getFeatured() — same
 *  mechanism (fixed catalogue picks), different products. No "new arrivals"
 *  equivalent exists: the schema carries no created/listed-date field, so
 *  that section is never built from invented recency. `excludeSkus` is the
 *  first row's resolved SKUs, so a backfill never duplicates a card already
 *  shown in Featured. */
export async function getRecommended(excludeSkus: string[] = []): Promise<Product[]> {
  const picks = ["FB-0105", "TN-0103", "AT-0115", "GF-0104"];
  return curatedRow(picks, MERCHANDISE_ROW_SIZE, excludeSkus);
}

/** Cross-category "popular picks" row for the homepage equipment band —
 *  real, currently-active SKUs spanning different sports, each shown with
 *  its own real standard price. `excludeSkus` keeps it from repeating
 *  whatever Featured/Recommended already surfaced. */
export async function getEquipmentPicks(excludeSkus: string[] = []): Promise<Product[]> {
  const picks = ["AC-4103", "AC-4008", "BD-2104", "AT-0108"];
  return curatedRow(picks, 4, excludeSkus);
}

/** Procurement-relevant cross-sell: same-category items only. Returns an
 *  empty list when the category has no other items — the caller hides the
 *  section rather than padding it with unrelated products. */
export async function getRelatedProducts(sku: string, limit = 4): Promise<Product[]> {
  return (await relatedProducts(sku, limit)) as Product[];
}
