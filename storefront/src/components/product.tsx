"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, useRecentlyViewed, useRole, useWishlist } from "@/components/providers";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";

/* ============================================================
   Product presentation — card, grid, list row, price block,
   wishlist toggle, add-to-cart. All role-aware state comes from
   the local fixture providers (ADR-0008) — no backend.
   ============================================================ */

export function discountPct(std: number, buyer: number): number | null {
  if (!(buyer < std) || std <= 0) return null;
  return Math.round((1 - buyer / std) * 1000) / 10;
}
const offLabel = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}% OFF`;

export function DiscountBadge({ off, className = "" }: { off: number; className?: string }) {
  return (
    <span className={"inline-flex items-center rounded-[2px] bg-ember-deep px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wide text-white " + className}>
      {offLabel(off)}
    </span>
  );
}

export function PriceBlock({ p, size = "card", showBadge = true }: { p: Product; size?: "card" | "detail"; showBadge?: boolean }) {
  const { role } = useRole();
  const big = size === "detail";
  const amountCls = "num font-display font-bold tracking-tight text-ink " + (big ? "text-[30px]" : "text-[19px]");
  const gst = <small className="font-body text-xs font-normal text-n600"> incl. GST</small>;

  if (role === "signed-in" && p.buyer !== undefined) {
    const off = discountPct(p.std, p.buyer);
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ember-deep">Your price</span>
          {off !== null && showBadge && <DiscountBadge off={off} />}
        </div>
        <div className={amountCls}>{inr(p.buyer)}{gst}</div>
        {off !== null ? (
          <div className="num mt-0.5 text-[13px] text-n600">Standard <span className="line-through decoration-n400">{inr(p.std)}</span></div>
        ) : (
          <div className="mt-0.5 text-[13px] text-n600">At the standard listed price</div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-n600">Standard price</div>
      <div className={amountCls}>{inr(p.std)}{gst}</div>
      <div className="mt-1 text-[13px] font-medium text-ember-deep">Sign in to view your price →</div>
    </div>
  );
}

function WishlistButton({ sku, name }: { sku: string; name: string }) {
  const { has, toggle } = useWishlist();
  const on = has(sku);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(sku); }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      title={on ? "Saved to wishlist" : "Save to wishlist"}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-n200 bg-chalk/90 shadow-raised backdrop-blur-sm transition-colors hover:border-n400"
    >
      <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 " + (on ? "fill-ember-deep stroke-ember-deep" : "fill-none stroke-n600")} strokeWidth="1.8">
        <path d="M12 20.5l-7.1-7.1a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" />
      </svg>
    </button>
  );
}

function CardAddToCart({ sku, name }: { sku: string; name: string }) {
  const { add } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        setBusy(true);
        add(sku, 1);
        toast(`Added ${name.split(" — ")[0]} — 1 unit. Open the cart to set quantity.`);
        setTimeout(() => setBusy(false), 250);
      }}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[2px] bg-ember-deep text-[13px] font-semibold text-white transition-colors hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
    >
      {busy ? "Adding…" : (<>
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path d="M4 5h2l1.5 10.5A2 2 0 0 0 9.5 17h7a2 2 0 0 0 2-1.6L20 8H6.5M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
        Add to Cart
      </>)}
    </button>
  );
}

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { role } = useRole();
  const off = role === "signed-in" && p.buyer !== undefined ? discountPct(p.std, p.buyer) : null;
  const href = `/product/${p.sku}`;
  return (
    <div className="group flex flex-col overflow-hidden rounded-[3px] border border-n200 bg-chalk transition-colors duration-200 hover:border-n400">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-n100">
        <Link href={href} aria-label={p.name} className="absolute inset-0 block">
          {p.img ? (
            <Image src={p.img} alt={`${p.name} — representative image`} fill priority={priority} sizes="(max-width: 479px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 300px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
              <span className="bg-n100 px-1 text-center font-mono text-[9px] uppercase tracking-wide text-n400">awaiting approved photography</span>
            </div>
          )}
        </Link>
        {off !== null && <DiscountBadge off={off} className="pointer-events-none absolute left-2 top-2 z-10 shadow-raised" />}
        <WishlistButton sku={p.sku} name={p.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-4">
        <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
        <Link href={href} className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-ink underline-offset-2 hover:underline md:text-[15px]">{p.name}</Link>
        <div className="mt-0.5 line-clamp-1 text-[12.5px] text-n600">{p.meta}</div>
        {p.configurable && (
          <span className="mt-1.5 inline-flex self-start rounded-[2px] bg-info-t px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-info">Configure to order</span>
        )}
        <div className="mt-auto space-y-3 border-t border-n100 pt-3">
          <PriceBlock p={p} showBadge={false} />
          <CardAddToCart sku={p.sku} name={p.name} />
        </div>
      </div>
    </div>
  );
}

export function ProductListRow({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { role } = useRole();
  const off = role === "signed-in" && p.buyer !== undefined ? discountPct(p.std, p.buyer) : null;
  const href = `/product/${p.sku}`;
  return (
    <div className="group flex gap-4 border-b border-n200 bg-chalk py-4 first:pt-0 last:border-b-0 sm:gap-5">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[2px] bg-n100 sm:w-36">
        <Link href={href} aria-label={p.name} className="absolute inset-0 block">
          {p.img ? (
            <Image src={p.img} alt={`${p.name} — representative image`} fill priority={priority} sizes="(max-width: 639px) 112px, 144px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
              <span className="bg-n100 px-1 text-center font-mono text-[8px] uppercase tracking-wide text-n400">awaiting photography</span>
            </div>
          )}
        </Link>
        {off !== null && <DiscountBadge off={off} className="pointer-events-none absolute left-1.5 top-1.5 z-10 shadow-raised" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
          <Link href={href} className="mt-1 block text-[15px] font-semibold leading-snug text-ink underline-offset-2 hover:underline">{p.name}</Link>
          <div className="mt-0.5 line-clamp-1 text-[12.5px] text-n600">{p.meta}</div>
        </div>
        <div className="mt-3 flex shrink-0 items-end justify-between gap-4 sm:mt-0 sm:w-[220px] sm:flex-col sm:items-end">
          <PriceBlock p={p} showBadge={false} />
          <div className="w-[136px]"><CardAddToCart sku={p.sku} name={p.name} /></div>
        </div>
      </div>
    </div>
  );
}

/** Records a real page view in the local "recently viewed" store —
 *  mount-only, no render output. Placed on the PDP. */
export function TrackView({ sku }: { sku: string }) {
  const { track } = useRecentlyViewed();
  useEffect(() => { track(sku); }, [sku, track]);
  return null;
}

export function AddToOrder({ p }: { p: Product }) {
  const { role } = useRole();
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  if (role !== "signed-in") {
    return (
      <Link className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press" href="/register">
        Sign in to order
      </Link>
    );
  }
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-3">
        <span className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk">
          <button aria-label="Decrease" className="h-full w-10 text-[17px]" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span className="num min-w-[52px] text-center font-semibold">{qty}</span>
          <button aria-label="Increase" className="h-full w-10 text-[17px]" onClick={() => setQty(qty + 1)}>+</button>
        </span>
        <button
          className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          onClick={() => { add(p.sku, qty); toast(`Added to cart — ${qty} units.`); }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export function WishlistToggleButton({ sku, name }: { sku: string; name: string }) {
  const { has, toggle } = useWishlist();
  const on = has(sku);
  return (
    <button
      type="button"
      onClick={() => toggle(sku)}
      aria-pressed={on}
      className="inline-flex h-11 items-center gap-2 rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
    >
      <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 " + (on ? "fill-ember-deep stroke-ember-deep" : "fill-none stroke-ink")} strokeWidth="1.8">
        <path d="M12 20.5l-7.1-7.1a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" />
      </svg>
      {on ? "Saved to wishlist" : "Save to wishlist"}
    </button>
  );
}

export function ProductGrid({ items, priorityCount = 0, view = "grid" }: { items: Product[]; priorityCount?: number; view?: "grid" | "list" }) {
  if (items.length === 0) {
    return (
      <div className="border border-n200 bg-chalk p-12 text-center text-[15px] text-n600">
        No products match these filters.
      </div>
    );
  }
  if (view === "list") {
    return <div>{items.map((p, i) => <ProductListRow key={p.sku} p={p} priority={i < priorityCount} />)}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {items.map((p, i) => <ProductCard key={p.sku} p={p} priority={i < priorityCount} />)}
    </div>
  );
}
