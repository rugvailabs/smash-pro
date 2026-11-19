import { CATEGORIES, PRODUCTS } from "@/data/products";
import type { Category, Product } from "@/lib/types";

/* ============================================================
   Storefront catalogue accessors — pure, synchronous reads over the
   static fixture data (ADR-0008). No server, no DB, no API route.
   Mirrors the *shape* of web/src/lib/catalog.ts so patterns translate
   directly when this UI is later wired to a real backend — but this
   file has zero dependency on web/.
   ============================================================ */

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function getProducts(cat?: string): Promise<Product[]> {
  return cat ? PRODUCTS.filter((p) => p.cat === cat) : PRODUCTS;
}

export async function getProduct(sku: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

export async function searchProducts(q: string): Promise<Product[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return PRODUCTS.filter((p) =>
    `${p.name} ${p.sub} ${p.cat} ${p.sku}`.toLowerCase().includes(needle)
  );
}

export async function getRelatedProducts(sku: string, limit = 4): Promise<Product[]> {
  const current = PRODUCTS.find((p) => p.sku === sku);
  if (!current) return [];
  return PRODUCTS.filter((p) => p.cat === current.cat && p.sku !== sku).slice(0, limit);
}

export async function getFeatured(): Promise<Product[]> {
  const picks = ["CR-0417", "BD-2001", "BB-0101", "SW-3001"];
  return picks.map((sku) => PRODUCTS.find((p) => p.sku === sku)).filter((p): p is Product => !!p);
}

export async function getRecommended(): Promise<Product[]> {
  const picks = ["FB-0105", "TN-0103", "AT-0115", "GF-0104"];
  return picks.map((sku) => PRODUCTS.find((p) => p.sku === sku)).filter((p): p is Product => !!p);
}
