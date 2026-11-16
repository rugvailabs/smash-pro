import { CATEGORIES, PRODUCTS } from "@/data/products";
import type { Category, Product } from "@/lib/types";

/** API BOUNDARY — async signatures so components never assume local data.
 *  Backend integration replaces the bodies of these functions only. */

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
  return PRODUCTS.find((p) => p.sku === sku);
}

export async function searchProducts(q: string): Promise<Product[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return PRODUCTS.filter((p) =>
    `${p.name} ${p.sub} ${p.cat}`.toLowerCase().includes(needle)
  );
}

export async function getFeatured(): Promise<Product[]> {
  return ["CR-0417", "BD-2001", "BB-0101", "SW-3001"]
    .map((sku) => PRODUCTS.find((p) => p.sku === sku))
    .filter((p): p is Product => Boolean(p));
}
