"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart, useRole } from "@/components/providers";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";

/* ============================================================
   Product presentation: role-aware price block (OBD-03 tiers),
   product card, grid, and the simple add-to-order control.
   No discount % anywhere (OBD-20 pending).
   ============================================================ */

export function PriceBlock({ p, size = "card" }: { p: Product; size?: "card" | "detail" }) {
  const { role } = useRole();
  const big = size === "detail";
  const amountCls =
    "num font-display font-bold tracking-tight text-ink " + (big ? "text-[31px]" : "text-lg");
  const gst = <small className="font-body text-xs font-normal text-n600"> incl. GST</small>;

  if (role === "buyer") {
    return (
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ember-deep">Your price</div>
        <div className={amountCls}>{inr(p.buyer)}{gst}</div>
        <div className="num mt-0.5 text-xs text-n600">Standard {inr(p.std)}</div>
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

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/product/${p.sku}`}
      className="group flex flex-col overflow-hidden rounded-[2px] border border-n200 bg-chalk transition-colors hover:border-n400"
    >
      <div className="relative aspect-[4/3] w-full bg-n100">
        <Image
          src={p.img}
          alt={`${p.name} — representative image`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 300px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-n600">{p.sub}</span>
        <div className="mt-1 text-[15px] font-semibold leading-tight text-ink group-hover:underline group-hover:underline-offset-2">
          {p.name}
        </div>
        <div className="mt-0.5 text-[13px] text-n600">{p.meta}</div>
        {p.configurable && (
          <span className="mt-1.5 self-start rounded-[2px] bg-info-t px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-info">
            Strung to order — configure
          </span>
        )}
        <div className="mt-auto border-t border-n100 pt-3">
          <PriceBlock p={p} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.sku} p={p} />
      ))}
    </div>
  );
}

export function AddToOrder({ p }: { p: Product }) {
  const { role } = useRole();
  const { add } = useCart();
  const [qty, setQty] = useState(24);
  const [note, setNote] = useState("");

  if (role !== "buyer") {
    return (
      <a className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press" href="#">
        Register to order
      </a>
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
            add(p.sku, qty);
            setNote(`added to your order — ${qty} units · open the cart to review`);
          }}
        >
          Add to order
        </button>
      </div>
      {note && <p className="font-mono text-[10px] uppercase tracking-wide text-n400">{note}</p>}
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
