"use client";

import { PRODUCTS } from "@/data/products";
import { useIsClient, useRecentlyViewed } from "@/components/providers";
import { ProductGrid } from "@/components/product";

/* Recently Viewed — real local browsing history (ADR-0008), not
   fabricated "trending" data. Renders nothing until there's real
   history to show. */
export function RecentlyViewedSection() {
  const { skus } = useRecentlyViewed();
  const mounted = useIsClient();
  if (!mounted || skus.length === 0) return null;

  const items = skus.map((sku) => PRODUCTS.find((p) => p.sku === sku)).filter((p): p is (typeof PRODUCTS)[number] => !!p);
  if (items.length === 0) return null;

  return (
    <section className="border-b border-n200 bg-chalk py-11 md:py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="mb-7 flex items-baseline gap-5">
          <h2 className="stretch-xp font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Recently viewed</h2>
        </div>
        <ProductGrid items={items} />
      </div>
    </section>
  );
}
