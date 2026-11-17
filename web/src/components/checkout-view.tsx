"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/providers";
import { Banner, GstCard, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { inr } from "@/lib/format";
import type { Address } from "@/lib/types";

/* ============================================================
   Checkout — OBD-08 (100% advance), OBD-20 (GST breakdown; rates
   per HSN pending — amounts unlabelled sample values), OBD-21
   (methods; online methods auto-confirm in the DEMO — no gateway
   is selected, ADR-0006), OBD-19 ◇ (shipping payer presentation
   pending — shown as a plain line). Placing the order is REAL:
   it creates the order server-side from the server cart (I3).
   ============================================================ */

const METHODS = [
  { key: "UPI", name: "UPI", note: "Confirmed automatically in this demo (gateway pending OBD-21)" },
  { key: "Card", name: "Card / Net Banking", note: "Confirmed automatically in this demo (gateway pending OBD-21)" },
  { key: "NEFT", name: "NEFT / RTGS or Cheque", note: "Upload payment proof — dispatch after admin verification" },
] as const;

export function CheckoutView({ addresses }: { addresses: Address[] }) {
  const { lines, summary } = useCart();
  const router = useRouter();
  const [addr, setAddr] = useState(0);
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("UPI");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    setError(null);
    try {
      const shipTo = addresses[addr]
        ? `${addresses[addr].label}, ${addresses[addr].detail.split("·")[0].trim()}`
        : "Primary address";
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shipTo, method }),
      });
      const data = (await res.json()) as { orderId?: string; error?: string };
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "The order could not be placed.");
        return;
      }
      router.push(`/checkout/payment?order=${data.orderId}`);
      router.refresh();
    } catch {
      setError("The order could not be placed.");
    } finally {
      setPlacing(false);
    }
  };

  if (!lines.length) {
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
    <div className="grid items-start gap-7 pb-20 lg:grid-cols-[7fr_5fr] lg:pb-0">
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
          {lines.map((l) => (
            <div key={l.key} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{l.name}</div>
                <div className="text-[13px] text-n600">
                  SKU <span className="font-mono text-xs">{l.sku}</span> ·{" "}
                  <span className="num">{l.qty} × {inr(l.unit)}</span>
                  {l.config && <> · {l.config.string} · {l.config.tension} · Grip {l.config.grip}</>}
                </div>
              </div>
              <div className="num text-sm font-semibold text-ink">{inr(l.total)}</div>
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
        <GstCard subtotal={summary.subtotalExGst} gst={summary.gst} shipping={summary.shipping} total={summary.total} />
        {error && (
          <Banner tone="bad" className="mt-3.5">{error}</Banner>
        )}
        {/* desktop action — the sticky bar carries it below lg (one primary per view) */}
        <button
          onClick={() => void placeOrder()}
          disabled={placing}
          className="mt-3.5 hidden h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400 lg:inline-flex"
        >
          {placing ? "Placing order…" : <>Place order &amp; pay {inr(summary.total)}</>}
        </button>
        <Banner tone="info" className="mt-3.5">
          <b className="text-ink">100% advance payment.</b> Dispatch follows
          confirmed payment. No credit facilities are offered.
        </Banner>
        <NoteFlag className="mt-2.5">
          amounts illustrative · shipping payer presentation pending OBD-19 ◇ ·
          GST rate labels pending OBD-20/OBD-11 · demo environment — no money
          moves (gateway pending OBD-21)
        </NoteFlag>
      </div>

      {/* sticky mobile summary bar — total + the one advancing action
          (DESIGN-STANDARDS §4); right inset clears the WhatsApp float */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-n200 bg-chalk shadow-raised lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 py-2.5 pl-4 pr-20">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wide text-n600">Total payable (incl. GST)</div>
            <div className="num font-display text-[17px] font-bold leading-tight text-ink">{inr(summary.total)}</div>
          </div>
          <button
            onClick={() => void placeOrder()}
            disabled={placing}
            className="inline-flex h-11 shrink-0 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press disabled:bg-n200 disabled:text-n400"
          >
            {placing ? "Placing…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
