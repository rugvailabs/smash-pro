"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRODUCTS } from "@/data/products";
import { useCart } from "@/components/providers";
import { Banner, Chip, KV, NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { DEMO_SHIPPING, demoGstSplit } from "@/components/checkout-view";
import { inr } from "@/lib/format";

/* ============================================================
   Payment states demonstration — OBD-21 confirmed rules:
   online payments auto-verified via gateway; NEFT/RTGS/cheque =
   proof upload + admin verification; retries until a configurable
   payment window closes (defaults PENDING ◇ — copy never states
   a duration). Frontend demonstration only — nothing is charged.
   ============================================================ */

export function PaymentDemo({ method }: { method: string }) {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [proofUploaded, setProofUploaded] = useState(false);
  const [utr, setUtr] = useState("");

  const itemsIncl = lines.reduce((s, l) => {
    const p = PRODUCTS.find((x) => x.sku === l.sku);
    return p ? s + (p.buyer + l.delta) * l.qty : s;
  }, 0);
  const { subtotal, gst } = demoGstSplit(itemsIncl);
  const total = itemsIncl + DEMO_SHIPPING;
  const offline = method === "neft";
  const methodName = method === "upi" ? "UPI" : method === "card" ? "Card / Net Banking" : "NEFT / RTGS / Cheque";

  if (!lines.length) {
    return (
      <Panel className="p-10 text-center">
        <p className="mb-4 text-[15px] text-ink">No active checkout — your order is empty.</p>
        <Link href="/catalog?cat=cricket" className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">
          Browse the catalogue
        </Link>
      </Panel>
    );
  }

  const finish = () => {
    clear();
    router.push("/orders");
  };

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      <div>
        {!offline ? (
          <>
            <Sect>Current state — payment confirmed</Sect>
            <Banner tone="ok">
              <b className="text-ink">Payment confirmed.</b> {methodName} payment
              verified automatically via the gateway — your order has moved to
              processing. <span className="ml-1.5 font-mono text-xs">TXN-DEMO-884120</span>
            </Banner>
            <NoteFlag className="mt-2.5">
              frontend demonstration — no gateway is connected and nothing was charged
            </NoteFlag>
          </>
        ) : (
          <>
            <Sect>Current state — {proofUploaded ? "proof under verification" : "upload payment proof"}</Sect>
            {proofUploaded ? (
              <>
                <Banner tone="warn">
                  <b className="text-ink">Payment proof uploaded, awaiting admin verification.</b>{" "}
                  Your order is reserved and will move to processing once the
                  payment is verified. Offline payments count as confirmed only
                  after review.
                </Banner>
                <Panel className="mt-3.5">
                  <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3">
                    <span className="font-mono text-[12.5px] text-ink">neft-utr-receipt.pdf</span>
                    <span className="text-xs text-n600">uploaded just now (demo)</span>
                    <span className="ml-auto"><Chip tone="warn">Awaiting verification</Chip></span>
                  </div>
                  <div className="px-4 py-3">
                    <KV k="Method">NEFT</KV>
                    <KV k="UTR reference"><span className="font-mono text-[12.5px]">{utr || "—"}</span></KV>
                    <KV k="Amount declared"><span className="num">{inr(total)}</span></KV>
                  </div>
                </Panel>
              </>
            ) : (
              <Panel className="p-5">
                <p className="mb-3.5 text-sm">
                  Pay <b className="num text-ink">{inr(total)}</b> by NEFT, RTGS
                  or cheque to the ProSmash account on your pro-forma, then
                  upload the payment proof. Dispatch follows admin verification.
                </p>
                <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="utr">UTR / instrument reference</label>
                <input
                  id="utr" type="text" value={utr} onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. N2026111412345678"
                  className="mb-3.5 h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 font-mono text-[13px] text-ink placeholder:text-n400"
                />
                <div className="mb-3.5 rounded-[2px] border border-dashed border-n400 bg-paper px-4 py-6 text-center text-sm text-n600">
                  Drag the payment proof here, or <b className="text-ink">browse</b>
                  <NoteFlag className="mt-1.5">non-functional prototype — no file is transmitted</NoteFlag>
                </div>
                <button
                  onClick={() => setProofUploaded(true)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press"
                >
                  Mark proof uploaded (demo)
                </button>
              </Panel>
            )}
          </>
        )}

        <Sect>Other payment states (design reference)</Sect>
        {offline || (
          <Banner tone="warn" className="mb-3">
            <b className="text-ink">Awaiting verification.</b> NEFT/RTGS and
            cheque payments count as confirmed only after admin review of the
            uploaded proof.
          </Banner>
        )}
        {!offline || (
          <Banner tone="ok" className="mb-3">
            <b className="text-ink">Payment confirmed.</b> Online payments are
            verified automatically via the gateway and the order moves to
            processing.
          </Banner>
        )}
        <Banner tone="bad">
          <b className="text-ink">Payment failed.</b> The gateway did not
          confirm this attempt. You can retry within the payment window; if it
          closes, the order is cancelled automatically and reserved stock is
          released.
        </Banner>
        <div className="mt-3 flex gap-3">
          <button className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press">Retry payment</button>
          <Link href="/checkout" className="inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">Switch method</Link>
        </div>
        <NoteFlag className="mt-2.5">
          amounts illustrative · payment-window defaults pending OBD-21 ◇ —
          copy never states a duration
        </NoteFlag>
      </div>

      <div className="lg:sticky lg:top-[132px]">
        <Panel className="p-4">
          <div className="flex justify-between py-1 text-sm">
            <span>Items subtotal <span className="text-n600">(ex-GST)</span></span>
            <span className="num">{inr(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-sm"><span>GST</span><span className="num">{inr(gst)}</span></div>
          <div className="flex justify-between py-1 text-sm"><span>Shipping</span><span className="num">{inr(DEMO_SHIPPING)}</span></div>
          <div className="mt-1.5 flex items-baseline justify-between border-t border-n400 pt-3">
            <b className="text-[15px] text-ink">Total payable</b>
            <span className="num font-display text-[21px] font-bold text-ink">{inr(total)}</span>
          </div>
        </Panel>
        <Panel className="mt-3.5">
          <PanelHead title="Order status" />
          <div className="px-4 py-3">
            <KV k="Order"><span className="font-mono text-[12.5px]">ORD-DEMO (not created)</span></KV>
            <KV k="Method">{methodName}</KV>
            <KV k="Status">
              {offline && !proofUploaded
                ? <Chip tone="neu">Proof required</Chip>
                : offline
                ? <Chip tone="warn">Awaiting verification</Chip>
                : <Chip tone="ok">Payment confirmed</Chip>}
            </KV>
          </div>
        </Panel>
        <button
          onClick={finish}
          className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
        >
          Finish demonstration — clear cart &amp; view orders
        </button>
        <NoteFlag className="mt-2">demo only — no order record is created</NoteFlag>
      </div>
    </div>
  );
}
