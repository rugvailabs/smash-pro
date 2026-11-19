"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useCart, useRole } from "@/components/providers";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";

/* ============================================================
   Product presentation: role-aware price block (OBD-03 tiers),
   product card, grid, and the simple add-to-order control.
   No discount % anywhere (OBD-20 pending).
   ============================================================ */

/** Discount percentage derived from the ACTUAL standard and applicable buyer
 *  prices — never hardcoded. Returns null when there is no saving (buyer price
 *  equals or exceeds standard). Rounded to one decimal, trailing .0 trimmed. */
export function discountPct(std: number, buyer: number): number | null {
  if (!(buyer < std) || std <= 0) return null;
  return Math.round((1 - buyer / std) * 1000) / 10;
}
const offLabel = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}% OFF`;

/** Prominent Ember discount chip, e.g. "15% OFF". */
export function DiscountBadge({ off, className = "" }: { off: number; className?: string }) {
  return (
    <span className={"inline-flex items-center rounded-[2px] bg-ember-deep px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wide text-white " + className}>
      {offLabel(off)}
    </span>
  );
}

export function PriceBlock({
  p, size = "card", showBadge = true,
}: { p: Product; size?: "card" | "detail"; showBadge?: boolean }) {
  const { role } = useRole();
  const big = size === "detail";
  const amountCls =
    "num font-display font-bold tracking-tight text-ink " + (big ? "text-[30px]" : "text-[19px]");
  const gst = <small className="font-body text-xs font-normal text-n600"> incl. GST</small>;

  // The applicable price exists only when the server priced this product
  // for an approved buyer session (price isolation at the boundary).
  if (role === "buyer" && p.buyer !== undefined) {
    const off = discountPct(p.std, p.buyer);
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ember-deep">Your price</span>
          {off !== null && showBadge && <DiscountBadge off={off} />}
        </div>
        <div className={amountCls}>{inr(p.buyer)}{gst}</div>
        {off !== null ? (
          <div className="num mt-0.5 text-[13px] text-n600">
            Standard <span className="line-through decoration-n400">{inr(p.std)}</span>
          </div>
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
      {role === "pending" ? (
        <div className="mt-1 text-xs text-n600">Your institutional pricing activates on approval</div>
      ) : (
        <div className="mt-1 text-[13px] font-medium text-ember-deep">Register to view your price →</div>
      )}
    </div>
  );
}

/* Wishlist — client-only, persisted in localStorage (no backend, no DB
   records). A tiny external store keeps every card's heart in sync and is
   SSR-safe (server snapshot is always "not saved"). Nothing server-side
   changes; the wishlist is a local convenience only. */
const WISHLIST_KEY = "sp-wishlist";
let wlSet: Set<string> | null = null;
const wlListeners = new Set<() => void>();
function wlLoad(): Set<string> {
  if (wlSet) return wlSet;
  try { wlSet = new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as string[]); }
  catch { wlSet = new Set(); }
  return wlSet;
}
function wlSubscribe(cb: () => void) { wlListeners.add(cb); return () => { wlListeners.delete(cb); }; }
function wlToggle(sku: string) {
  const next = new Set(wlLoad());
  if (next.has(sku)) next.delete(sku); else next.add(sku);
  wlSet = next;
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next])); } catch { /* storage blocked */ }
  for (const l of wlListeners) l();
}
function WishlistButton({ sku, name }: { sku: string; name: string }) {
  const on = useSyncExternalStore(wlSubscribe, () => wlLoad().has(sku), () => false);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    wlToggle(sku);
  };
  return (
    <button
      type="button"
      onClick={toggle}
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

/* Add to Cart — role-aware. Approved buyers add to their order (uses the
   existing cart engine); everyone else is routed to register. Server pricing
   is untouched; quantity is set/refined in the cart. */
function CardAddToCart({ sku, name }: { sku: string; name: string }) {
  const { role } = useRole();
  const { add } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (role !== "buyer") {
    return (
      <Link
        href="/register"
        className="inline-flex h-10 w-full items-center justify-center rounded-[2px] border border-n400 bg-chalk text-[13px] font-semibold text-ink transition-colors hover:border-ink"
      >
        Register to order
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        setBusy(true);
        add(sku, 1)
          .then(() => toast(`Added ${name.split(" — ")[0]} — 1 unit. Open the cart to set quantity.`))
          .catch(() => toast("Couldn't add to your order — please try again."))
          .finally(() => setBusy(false));
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
  // Premium commerce card: image + title link to the PDP; wishlist and Add to
  // Cart are separate controls (not nested in a link). The only discount shown
  // is the real saving computed from the approved buyer's own price — never a
  // hardcoded figure, no fabricated ratings / stock / delivery.
  const { role } = useRole();
  const off =
    role === "buyer" && p.buyer !== undefined ? discountPct(p.std, p.buyer) : null;
  const href = `/product/${p.sku}`;
  return (
    <div className="group flex flex-col overflow-hidden rounded-[3px] border border-n200 bg-chalk transition-colors duration-200 hover:border-n400">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-n100">
        <Link href={href} aria-label={p.name} className="absolute inset-0 block">
          {p.img ? (
            <Image
              src={p.img}
              alt={`${p.name} — representative image`}
              fill
              priority={priority}
              sizes="(max-width: 479px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 300px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            /* Library §4: labelled placeholder frame — no substitute imagery. */
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)",
              }}
            >
              <span className="bg-n100 px-1 text-center font-mono text-[9px] uppercase tracking-wide text-n400">
                awaiting approved photography
              </span>
            </div>
          )}
        </Link>
        {off !== null && <DiscountBadge off={off} className="pointer-events-none absolute left-2 top-2 z-10 shadow-raised" />}
        <WishlistButton sku={p.sku} name={p.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-4">
        <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
        <Link href={href} className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-ink underline-offset-2 hover:underline md:text-[15px]">
          {p.name}
        </Link>
        <div className="mt-0.5 line-clamp-1 text-[12.5px] text-n600">{p.meta}</div>
        {p.configurable && (
          <span className="mt-1.5 inline-flex self-start rounded-[2px] bg-info-t px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-info">
            Configure to order
          </span>
        )}
        <div className="mt-auto space-y-3 border-t border-n100 pt-3">
          {/* the corner badge already carries the % on the card, so suppress
              the inline one here to avoid a doubled badge */}
          <PriceBlock p={p} showBadge={false} />
          <CardAddToCart sku={p.sku} name={p.name} />
        </div>
      </div>
    </div>
  );
}

/** Horizontal list row — same real data/controls as ProductCard (image,
 *  sub, name, meta, configurable flag, role-aware price, add-to-cart),
 *  laid out for the list view toggle instead of a grid tile. */
export function ProductListRow({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { role } = useRole();
  const off = role === "buyer" && p.buyer !== undefined ? discountPct(p.std, p.buyer) : null;
  const href = `/product/${p.sku}`;
  return (
    <div className="group flex gap-4 border-b border-n200 bg-chalk py-4 first:pt-0 last:border-b-0 sm:gap-5">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[2px] bg-n100 sm:w-36">
        <Link href={href} aria-label={p.name} className="absolute inset-0 block">
          {p.img ? (
            <Image
              src={p.img}
              alt={`${p.name} — representative image`}
              fill
              priority={priority}
              sizes="(max-width: 639px) 112px, 144px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}
            >
              <span className="bg-n100 px-1 text-center font-mono text-[8px] uppercase tracking-wide text-n400">awaiting photography</span>
            </div>
          )}
        </Link>
        {off !== null && <DiscountBadge off={off} className="pointer-events-none absolute left-1.5 top-1.5 z-10 shadow-raised" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
          <Link href={href} className="mt-1 block text-[15px] font-semibold leading-snug text-ink underline-offset-2 hover:underline">
            {p.name}
          </Link>
          <div className="mt-0.5 line-clamp-1 text-[12.5px] text-n600">{p.meta}</div>
          {p.configurable && (
            <span className="mt-1.5 inline-flex rounded-[2px] bg-info-t px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-info">
              Configure to order
            </span>
          )}
        </div>
        <div className="mt-3 flex shrink-0 items-end justify-between gap-4 sm:mt-0 sm:w-[220px] sm:flex-col sm:items-end">
          <PriceBlock p={p} showBadge={false} />
          <div className="w-[136px]"><CardAddToCart sku={p.sku} name={p.name} /></div>
        </div>
      </div>
    </div>
  );
}

/** priorityCount: eager-load the first N card images — used only where the
 *  grid is above the fold (the catalogue LCP); defaults to 0 so other grids
 *  keep lazy loading. Deliberate column steps: 2 (mobile) → 3 (tablet/laptop)
 *  → 4 (desktop); min-w-0 on cards prevents any horizontal overflow.
 *  view="list" switches to ProductListRow — same data, horizontal layout. */
export function ProductGrid({
  items, priorityCount = 0, view = "grid",
}: { items: Product[]; priorityCount?: number; view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div>
        {items.map((p, i) => <ProductListRow key={p.sku} p={p} priority={i < priorityCount} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {items.map((p, i) => (
        <ProductCard key={p.sku} p={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function AddToOrder({ p }: { p: Product }) {
  const { role } = useRole();
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(24);

  if (role !== "buyer") {
    return (
      <Link className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press" href="/register">
        Register to order
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
          onClick={() => {
            add(p.sku, qty)
              .then(() => toast(`Added to your order — ${qty} units. Open the cart to review.`))
              .catch(() => toast("Couldn't add to your order — please try again."));
          }}
        >
          Add to order
        </button>
      </div>
      <p className="mt-1 text-[13px] text-n600">
        Approved institutions order with 100% advance payment — dispatch follows confirmed payment.
      </p>
    </div>
  );
}

export function BuyerAvailability() {
  const { role } = useRole();
  if (role !== "buyer") return null;
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <span className="inline-flex h-6 items-center gap-1.5 rounded-[2px] bg-ok-t px-2 text-xs font-medium text-ok before:h-1.5 before:w-1.5 before:rounded-full before:bg-current">
        In stock
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-n400">
        availability display provisional · P-06
      </span>
    </div>
  );
}
