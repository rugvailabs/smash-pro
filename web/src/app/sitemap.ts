import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";

const BASE = "https://smashpro.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/register/supplier`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/register/visitor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/service`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/catalog?cat=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${p.sku}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
