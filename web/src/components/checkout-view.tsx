"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRODUCTS } from "@/data/products";
import { useCart } from "@/components/providers";
import { Banner, GstCard, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { inr } from "@/lib/format";
import type { Address } from "@/lib/types";

/* ============================================================
   Checkout — OBD-08 (100% advance), OBD-20 (GST breakdown; rates
   per HSN pending — amounts unlabelled sample values), OBD-21
   (methods + verification paths), OBD-19 ◇ (shipping payer
   presentation pending — shown as a plain line). Connected to the
   live demo cart. Frontend demonstration only — nothing is charged.
   ============================================================ */

const METHODS = [
  { key: "upi", name: "UPI", note: "Verified automatically on payment" },
  { key: "card", name: "Card / Net Banking", note: "Verified automatically via gateway" },
  { key: "neft", name: "NEFT / RTGS or Cheque", note: "Upload payment proof — dispatch after admin verification" },
] as const;

/** Illustrative GST portion of a GST-inclusive total (sample values only —
 *  real itemised GST awaits rates per product HSN, OBD-20/OBD-11). */
export function demoGstSplit(itemsInclGst: number) {
  const gst = Math.round(itemsInclGst * 0.1067 * 100) / 100;
  return { subtotal: Math.round((itemsInclGst - gst) * 100) / 100, gst };
}

export const DEMO_SHIPPING = 1200;

export function CheckoutView({ addresses }: { addresses: Address[] }) {
  const { lines } = useCart();
  const router = useRouter();
  const [addr, setAddr] = useState(0);
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("upi");

  const priced = lines
    .map((l) => {
      const p = PRODUCTS.find((x) => x.sku === l.sku);
      return p ? { l, p, unit: p.buyer + l.delta, total: (p.buyer + l.delta) * l.qty } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const itemsIncl = priced.reduce((s, x) => s + x.total, 0);
  const { subtotal, gst } = demoGstSplit(itemsIncl);
  const total = itemsIncl + DEMO_SHIPPING;

  if (!priced.length) {
    return (
      <Panel className="p-10 text-center">
        <p className="mb-4 text-[15px] text-ink">Nothing to check out — your order is empty.</p>
        <Link href="/catalog?cat=cricket" className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">
          Browse the catalogue
        </Link>
      </Panel>
    );
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      <div>
        <Sect>1 · Delivery address</Sect>
        <div className="space-y-2.5">
          {addresses.map((a, i) => (
            <label
              key={a.label}
              className={
                "flex cursor-pointer gap-3 rounded-[2px] border bg-chalk p-4 " +
                (addr === i ? "border-ember-deep shadow-[inset_0_0_0_1px_var(--color-ember-deep)]" : "border-n200 hover:border-n400")
              }
            >
              <input
                type="radio" name="addr" checked={addr === i} onChange={() => setAddr(i)}
                className="mt-1 accent-[var(--color-ember-deep)]"
              />
              <span className="text-sm">
                <b className="text-ink">{a.label}</b>
                <small className="block text-[13px] text-n600">{a.detail}</small>
              </span>
            </label>
          ))}
        </div>
        <Link href="/account" className="mt-2.5 inline-block text-[13px] font-semibold text-ember-deep hover:underline">
          + Add a new address
        </Link>

        <Sect>2 · Order lines</Sect>
        <Panel>
          {priced.map(({ l, p, unit, total }) => (
            <div key={l.key} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{p.name}</div>
                <div className="text-[13px] text-n600">
                  SKU <span className="font-mono text-xs">{p.sku}</span> ·{" "}
                  <span className="num">{l.qty} × {inr(unit)}</span>
                  {l.config && <> · {l.config.string} · {l.config.tension} · Grip {l.config.grip}</>}
                </div>
              </div>
              <div className="num text-sm font-semibold text-ink">{inr(total)}</div>
            </div>
          ))}
        </Panel>

        <Sect>3 · Payment method</Sect>
        <div className="space-y-2.5">
          {METHODS.map((m) => (
            <label
              key={m.key}
              className={
                "flex cursor-pointer gap-3 rounded-[2px] border bg-chalk p-4 " +
                (method === m.key ? "border-ember-deep shadow-[inset_0_0_0_1px_var(--color-ember-deep)]" : "border-n200 hover:border-n400")
              }
            >
              <input
                type="radio" name="method" checked={method === m.key} onChange={() => setMethod(m.key)}
                className="mt-1 accent-[var(--color-ember-deep)]"
              />
              <span className="text-sm">
                <b className="text-ink">{m.name}</b>
                <small className="block text-[13px] text-n600">{m.note}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="lg:sticky lg:top-[132px]">
        {/* single shared GST block (library §16) — identical at checkout,
            payment and order detail */}
        <GstCard subtotal={subtotal} gst={gst} shipping={DEMO_SHIPPING} total={total} />
        <button
          onClick={() => router.push(`/checkout/payment?method=${method}`)}
          className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
        >
          Pay {inr(total)}
        </button>
        <Banner tone="info" className="mt-3.5">
          <b className="text-ink">100% advance payment.</b> Dispatch follows
          confirmed payment. No credit facilities are offered.
        </Banner>
        <NoteFlag className="mt-2.5">
          amounts illustrative · shipping payer presentation pending OBD-19 ◇ ·
          GST rate labels pending OBD-20/OBD-11 · frontend demonstration — no
          real payment
        </NoteFlag>
      </div>
    </div>
  );
}
