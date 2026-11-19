"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, useIsClient } from "@/components/providers";
import { inr } from "@/lib/format";

const PAYMENT_METHODS = ["UPI", "Card", "Net Banking", "NEFT/RTGS", "Cheque"];

export default function CheckoutPage() {
  const { lines, summary, clear } = useCart();
  const mounted = useIsClient();
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  if (!mounted) return <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10" />;

  if (placed) {
    return (
      <main className="mx-auto max-w-[520px] px-4 py-16 text-center md:px-10">
        <svg viewBox="0 0 24 24" aria-hidden className="mx-auto h-12 w-12 fill-none stroke-ok" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Order placed (preview)</h1>
        <p className="mt-2 text-[14px] text-n600">This is a UI preview — no real order, payment or backend record was created.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Back to homepage</Link>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-[520px] px-4 py-16 text-center md:px-10">
        <p className="text-[15px] text-n600">Your cart is empty.</p>
        <Link href="/catalog" className="mt-4 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Browse the catalogue</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Checkout</h1>
      <div className="mt-7 grid gap-9 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2px] border border-n200 bg-chalk p-5">
            <div className="font-display text-[15px] font-bold text-ink">Delivery address</div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Institution name, street, city, state, PIN"
              className="mt-3 w-full rounded-[2px] border border-n400 bg-chalk px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div className="rounded-[2px] border border-n200 bg-chalk p-5">
            <div className="font-display text-[15px] font-bold text-ink">Payment method</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m} className={"rounded-[2px] border px-3.5 py-2 text-sm transition-colors " + (method === m ? "border-ember-deep font-semibold shadow-[inset_0_0_0_1px_var(--color-ember-deep)]" : "border-n400 hover:border-ink")}>{m}</button>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-n600">100% advance payment — dispatch follows confirmed payment. No credit facilities.</p>
          </div>
          {error && <p className="text-[13px] font-medium text-bad">{error}</p>}
        </div>

        <div className="h-fit rounded-[2px] border border-n200 bg-chalk p-5">
          <div className="font-display text-[15px] font-bold text-ink">Order summary</div>
          <ul className="mt-4 space-y-2 text-[13px] text-n600">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{l.name} × {l.qty}</span>
                <span className="num shrink-0 text-ink">{inr(l.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-n200 pt-3 text-[13.5px] text-n600">
            <div className="flex justify-between"><span>Subtotal</span><span className="num text-ink">{inr(summary.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (illustrative)</span><span className="num text-ink">{inr(summary.gst)}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-n200 pt-3 text-[16px] font-semibold text-ink">
            <span>Total</span><span className="num">{inr(summary.total)}</span>
          </div>
          <button
            onClick={() => {
              if (!address.trim()) { setError("Enter a delivery address before placing the order."); return; }
              setError(null);
              clear();
              setPlaced(true);
            }}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-[2px] bg-ember-deep text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          >
            Place order
          </button>
        </div>
      </div>
    </main>
  );
}
