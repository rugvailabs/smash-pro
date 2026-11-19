"use client";

import Image from "next/image";
import Link from "next/link";
import { useIsClient, useCart, useRole } from "@/components/providers";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { lines, summary, setQty, remove, clear } = useCart();
  const { role } = useRole();
  const mounted = useIsClient();

  if (!mounted) return <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10" />;

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your cart</h1>
        <div className="mt-8 flex flex-col items-center gap-4 border border-n200 bg-chalk py-16 text-center">
          <svg viewBox="0 0 24 24" aria-hidden className="h-10 w-10 fill-none stroke-n400" strokeWidth="1.5"><path d="M4 5h2l1.5 10.5A2 2 0 0 0 9.5 17h7a2 2 0 0 0 2-1.6L20 8H6.5M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
          <p className="text-[15px] text-n600">Your cart is empty.</p>
          <Link href="/catalog" className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Browse the catalogue</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your cart</h1>
        <button onClick={clear} className="text-[13px] font-semibold text-ember-deep underline-offset-2 hover:underline">Clear cart</button>
      </div>

      {role !== "signed-in" && (
        <div className="mb-5 border-l-[3px] border-ember-deep bg-chalk px-4 py-3 text-sm">
          <b className="text-ink">Standard prices shown.</b> <Link href="/register" className="font-semibold text-ember-deep hover:underline">Sign in to see your institutional price →</Link>
        </div>
      )}

      <div className="grid gap-9 lg:grid-cols-[1fr_360px]">
        <div>
          {lines.map((l) => (
            <div key={l.key} className="flex gap-4 border-b border-n200 py-4 first:pt-0">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100">
                {l.img && <Image src={l.img} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${l.sku}`} className="text-[14px] font-semibold text-ink hover:underline">{l.name}</Link>
                {l.config && <div className="mt-0.5 text-[12.5px] text-n600">{l.config.string} · {l.config.tension} · Grip {l.config.grip}</div>}
                <div className="num mt-1 text-[13px] text-n600">{inr(l.unit)} each</div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex h-9 items-center rounded-[2px] border border-n400 bg-chalk">
                    <button aria-label="Decrease quantity" className="h-full w-8 text-[15px]" onClick={() => setQty(l.key, l.qty - 1)}>−</button>
                    <span className="num min-w-[36px] text-center text-sm font-semibold">{l.qty}</span>
                    <button aria-label="Increase quantity" className="h-full w-8 text-[15px]" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
                  </span>
                  <button onClick={() => remove(l.key)} className="text-[12.5px] font-medium text-n600 underline-offset-2 hover:text-ember-deep hover:underline">Remove</button>
                </div>
              </div>
              <div className="num shrink-0 text-right text-[15px] font-semibold text-ink">{inr(l.total)}</div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-[2px] border border-n200 bg-chalk p-5">
          <div className="font-display text-[15px] font-bold text-ink">Order summary</div>
          <div className="mt-4 space-y-2 text-[13.5px] text-n600">
            <div className="flex justify-between"><span>Subtotal</span><span className="num text-ink">{inr(summary.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (illustrative)</span><span className="num text-ink">{inr(summary.gst)}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-n200 pt-3 text-[16px] font-semibold text-ink">
            <span>Total</span><span className="num">{inr(summary.total)}</span>
          </div>
          <Link href="/checkout" className="mt-5 flex h-12 w-full items-center justify-center rounded-[2px] bg-ember-deep text-sm font-semibold text-white transition-colors hover:bg-ember-press">
            Proceed to checkout
          </Link>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">fixture pricing · gst rate illustrative</p>
        </div>
      </div>
    </main>
  );
}
