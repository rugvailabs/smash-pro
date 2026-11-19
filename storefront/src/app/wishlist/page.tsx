"use client";

import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { useIsClient, useWishlist } from "@/components/providers";
import { ProductGrid } from "@/components/product";

/* Wishlist — reads the local wishlist store and renders saved products
   as real product cards. Frontend fixture only (ADR-0008). */

export default function WishlistPage() {
  const { skus } = useWishlist();
  const mounted = useIsClient();
  const items = PRODUCTS.filter((p) => skus.includes(p.sku));

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your wishlist</h1>
      <p className="mt-2 text-[14px] text-n600">Saved products, kept on this device.</p>

      <div className="mt-7">
        {!mounted ? null : items.length > 0 ? (
          <ProductGrid items={items} />
        ) : (
          <div className="flex flex-col items-center gap-4 border border-n200 bg-chalk py-16 text-center">
            <svg viewBox="0 0 24 24" aria-hidden className="h-10 w-10 fill-none stroke-n400" strokeWidth="1.5">
              <path d="M12 20.5l-7.1-7.1a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" />
            </svg>
            <p className="text-[15px] text-n600">Your wishlist is empty — save products you&rsquo;re considering for later.</p>
            <Link href="/catalog" className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Browse the catalogue</Link>
          </div>
        )}
      </div>
    </main>
  );
}
