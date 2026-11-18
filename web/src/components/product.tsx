"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  // One premium vertical card used at every width (consistent presentation):
  // large image area on a refined neutral ground with a subtle hover zoom,
  // clamped name/meta for uniform heights, role-aware price block pinned to
  // the base. The only discount shown is the real saving computed from the
  // approved buyer's own price — no fabricated ratings / stock / delivery.
  const { role } = useRole();
  const off =
    role === "buyer" && p.buyer !== undefined ? discountPct(p.std, p.buyer) : null;
  return (
    <Link
      href={`/product/${p.sku}`}
      className="group flex flex-col overflow-hidden rounded-[3px] border border-n200 bg-chalk transition-colors duration-200 hover:border-n400"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-n100">
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
        {p.configurable && (
          <span className="absolute left-2 top-2 rounded-[2px] bg-info-t px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-info">
            Configure to order
          </span>
        )}
        {off !== null && <DiscountBadge off={off} className="absolute right-2 top-2 shadow-raised" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 md:p-4">
        <span className="truncate font-mono text-[10.5px] uppercase tracking-widest text-n600">{p.sub}</span>
        <div className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-2 md:text-[15px]">
          {p.name}
        </div>
        <div className="mt-0.5 line-clamp-1 text-[12.5px] text-n600">{p.meta}</div>
        <div className="mt-auto border-t border-n100 pt-3">
          {/* the corner badge already carries the % on the card, so suppress
              the inline one here to avoid a doubled badge */}
          <PriceBlock p={p} showBadge={false} />
        </div>
      </div>
    </Link>
  );
}

/** priorityCount: eager-load the first N card images — used only where the
 *  grid is above the fold (the catalogue LCP); defaults to 0 so other grids
 *  keep lazy loading. Deliberate column steps: 2 (mobile) → 3 (tablet/laptop)
 *  → 4 (desktop); min-w-0 on cards prevents any horizontal overflow. */
export function ProductGrid({ items, priorityCount = 0 }: { items: Product[]; priorityCount?: number }) {
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
