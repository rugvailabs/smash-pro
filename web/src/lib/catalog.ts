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

export async function getFeatured(): Promise<Product[]> {
  const picks = ["CR-0417", "BD-2001", "BB-0101", "SW-3001"];
  const out: Product[] = [];
  for (const sku of picks) {
    const p = await getProductBySku(sku);
    if (p) out.push(p as Product);
  }
  return out;
}

/** A second curated real-SKU row, distinct from getFeatured() — same
 *  mechanism (fixed catalogue picks), different products. No "new arrivals"
 *  equivalent exists: the schema carries no created/listed-date field, so
 *  that section is never built from invented recency. */
export async function getRecommended(): Promise<Product[]> {
  const picks = ["FB-0105", "TN-0103", "AT-0115", "GF-0104"];
  const out: Product[] = [];
  for (const sku of picks) {
    const p = await getProductBySku(sku);
    if (p) out.push(p as Product);
  }
  return out;
}

/** Procurement-relevant cross-sell: same-category items only. Returns an
 *  empty list when the category has no other items — the caller hides the
 *  section rather than padding it with unrelated products. */
export async function getRelatedProducts(sku: string, limit = 4): Promise<Product[]> {
  return (await relatedProducts(sku, limit)) as Product[];
}
