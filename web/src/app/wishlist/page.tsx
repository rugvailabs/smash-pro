"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { useIsClient } from "@/components/providers";
import { EmptyState } from "@/components/empty-state";
import { Container } from "@/components/container";

/* Wishlist — reads the same localStorage key the product-card heart
   toggle already writes to ("sp-wishlist", see components/product.tsx).
   Client-only convenience list; no backend record.

   Deliberately shows no price here: this page can only read the static
   sample catalogue (client components can't reach the server-only
   pricing path), and a signed-in buyer's real applicable price is
   computed live by server/pricing.ts — showing the static sample figure
   here could disagree with what they'd actually see at checkout. The
   product detail page (server-rendered) is always the source of truth
   for price; this page links there. */
const WISHLIST_KEY = "sp-wishlist";

export default function WishlistPage() {
  const mounted = useIsClient();
  const [skus, setSkus] = useState<string[]>([]);

  useEffect(() => {
    try {
      setSkus(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as string[]);
    } catch { /* ignore */ }
  }, []);

  const items = PRODUCTS.filter((p) => skus.includes(p.sku));

  return (
    <Container as="main" className="py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your wishlist</h1>
      <p className="mt-2 text-[14px] text-n600">Saved products, kept on this device.</p>
      <div className="mt-7">
        {!mounted ? null : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {items.map((p) => (
              <Link key={p.sku} href={`/product/${p.sku}`} className="group block overflow-hidden rounded-[3px] border border-n200 bg-chalk transition-colors hover:border-n400">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-n100">
                  {p.img ? (
                    <Image src={p.img} alt={`${p.name} — representative image`} fill sizes="(max-width: 479px) 50vw, (max-width: 768px) 33vw, 300px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
                      <span className="bg-n100 px-1 text-center font-mono text-[9px] uppercase tracking-wide text-n400">awaiting approved photography</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 md:p-4">
                  <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
                  <div className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-ink md:text-[15px]">{p.name}</div>
                  <div className="mt-1 text-[12.5px] font-medium text-ember-deep">View price &amp; order →</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            message="Your wishlist is empty."
            hint="Save products you're considering for later using the heart on any product card."
            actionLabel="Browse the catalogue"
            actionHref="/catalog?cat=cricket"
          />
        )}
      </div>
    </Container>
  );
}
