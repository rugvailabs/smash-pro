"use client";

import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { useCart, useRole } from "@/components/providers";
import { inr } from "@/lib/format";

/* Working demo cart. Checkout is role-gated — approved buyers proceed to
   the Phase C checkout (address · GST presentation · payment methods). */

export function CartView() {
  const { role } = useRole();
  const { lines, setQty, remove } = useCart();

  const priced = lines
    .map((l) => {
      const p = PRODUCTS.find((x) => x.sku === l.sku);
      if (!p) return null;
      const unit = (role === "buyer" ? p.buyer : p.std) + l.delta;
      return { l, p, unit, total: unit * l.qty };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const total = priced.reduce((s, x) => s + x.total, 0);

  if (!priced.length) {
    return (
      <div className="border border-n200 bg-chalk p-12 text-center">
        <p className="mb-4 text-[15px] text-ink">Your order is empty.</p>
        <Link href="/catalog?cat=cricket" className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      <div className="border border-n200 bg-chalk">
        {priced.map(({ l, p, unit, total }) => (
          <div key={l.key} className="flex flex-wrap items-center gap-3.5 border-b border-n100 p-4 last:border-b-0">
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden bg-n100">
              <Image src={p.img} alt="" fill sizes="72px" className="object-cover" />
            </div>
            <div className="min-w-[190px] flex-1">
              <div className="text-sm font-semibold text-ink">{p.name}</div>
              <div className="font-mono text-xs text-n600">SKU {p.sku}</div>
              {l.config && (
                <div className="mt-0.5 text-[12.5px] text-n600">
                  String: {l.config.string} · Tension: {l.config.tension} · Grip: {l.config.grip}
                  {l.delta > 0 && (
                    <> · option +{inr(l.delta)}{" "}
                      <span className="font-mono text-[10px] uppercase text-n400">illustrative, pending</span>
                    </>
                  )}
                </div>
              )}
              <div className="num mt-0.5 text-[13px] text-n600">{inr(unit)} / unit · incl. GST</div>
            </div>
            <span className="inline-flex h-9 items-center rounded-[2px] border border-n400 bg-chalk">
              <button aria-label="Decrease" className="h-full w-8" onClick={() => setQty(l.key, l.qty - 1)}>−</button>
              <span className="num min-w-[44px] text-center text-sm font-semibold">{l.qty}</span>
              <button aria-label="Increase" className="h-full w-8" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
            </span>
            <div className="num w-full text-right text-[15px] font-semibold text-ink sm:w-auto">{inr(total)}</div>
            <button className="text-[13px] font-medium text-ember-deep hover:underline" onClick={() => remove(l.key)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-[132px]">
        <div className="border border-n200 bg-chalk p-5">
          <div className="flex justify-between py-1.5 text-sm">
            <span>Items (incl. GST)</span>
            <span className="num">{inr(total)}</span>
          </div>
          <div className="pb-1.5 text-xs text-n600">
            Full GST breakdown and any shipping charge appear at checkout
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-n400 pt-3.5">
            <b className="text-[15px] text-ink">Order value so far</b>
            <span className="num font-display text-[21px] font-bold text-ink">{inr(total)}</span>
          </div>
        </div>
        {role === "buyer" ? (
          <Link
            href="/checkout"
            className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          >
            Proceed to checkout
          </Link>
        ) : (
          <a className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white" href="#">
            Register to order
          </a>
        )}
        <Link href="/catalog?cat=cricket" className="mt-2.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink">
          Continue browsing
        </Link>
        <div className="mt-3.5 border-l-[3px] border-info bg-info-t px-4 py-3 text-sm">
          <b className="text-ink">100% advance payment.</b> Orders dispatch
          after full payment is confirmed — ordering requires an approved buyer
          account.
        </div>
      </div>
    </div>
  );
}
