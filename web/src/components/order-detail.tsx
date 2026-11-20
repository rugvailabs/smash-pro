"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, Chip, DocRow, GstCard, KV, NoteFlag, Panel, PanelHead, Rail, Sect } from "@/components/buyer-ui";
import { BuyerReorderButton } from "@/components/buyer-reorder-button";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";
import type { Order } from "@/lib/types";

/* ============================================================
   Order detail + delivery confirmation + delivery-issue entry —
   now REAL (integration point I3): confirmation and complaint
   submissions write server-side records. Direct-shipment orders:
   the confirmation request appears only after supplier proof
   upload (OBD-19 Option A, proof-first). The buyer sees NO
   supplier identity (access boundary §3). Non-response/dispute
   handling pending OBD-19 ◇. Invoice download is a design
   reference only (OBD-11 pending).
   ============================================================ */

export function OrderDetail({ order }: { order: Order }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(Boolean(order.receiptConfirmed));
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmReceipt = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-receipt`, { method: "POST" });
      if (res.ok) {
        setConfirmed(true);
        toast("Receipt confirmed — on record with the delivery proof.");
        router.refresh();
      } else {
        toast("The confirmation didn't go through — please try again.");
      }
    } catch {
      toast("The confirmation didn't go through — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitIssue = async () => {
    const body = issueText.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/complaint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setIssueSent(true);
        toast("Report received — Smash Pro will coordinate the resolution.");
      } else {
        toast("The report didn't go through — please try again.");
      }
    } catch {
      toast("The report didn't go through — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const needsConfirm = order.direct && order.deliveryProofOnRecord && !confirmed;
  const paid = order.payment.status === "confirmed";

  const rail = confirmed
    ? order.rail.map((s) =>
        s.state === "cur" ? { ...s, label: "Delivered — receipt confirmed", state: "done" as const } : s)
    : order.rail;

  return (
    <>
      {needsConfirm && (
        <Banner tone="warn" className="mb-5">
          <span className="flex flex-wrap items-center gap-3">
            <span className="min-w-[260px] flex-1">
              <b className="text-ink">Delivery proof received — please confirm receipt.</b>{" "}
              This shipment was marked delivered on {order.deliveredOn} and
              delivery proof is on record. Confirm that your institution
              received it in order.
            </span>
            <button
              onClick={() => void confirmReceipt()}
              disabled={busy}
              className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:bg-n200 disabled:text-n400"
            >
              {busy ? "Confirming…" : "Confirm delivery receipt"}
            </button>
          </span>
        </Banner>
      )}
      {order.direct && confirmed && (
        <Banner tone="ok" className="mb-5">
          <b className="text-ink">Receipt confirmed.</b> Thank you — your
          confirmation is on record with the delivery proof, and Smash Pro has
          been notified.
        </Banner>
      )}

      <Sect>Order progress</Sect>
      <Rail steps={rail} />

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Lines</Sect>
          <Panel>
            {order.lines.map((l) => (
              <div key={l.sku} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{l.name}</div>
                  <div className="text-[13px] text-n600">
                    SKU <span className="font-mono text-xs">{l.sku}</span> ·{" "}
                    <span className="num">{l.qty} × {inr(l.unit)}</span> incl. GST
                  </div>
                </div>
                <div className="num text-sm font-semibold text-ink">{inr(l.unit * l.qty)}</div>
              </div>
            ))}
          </Panel>

          <Sect>Delivery</Sect>
          <Panel className="px-4 py-3">
            {/* deliveryMethod (OBD-22) governs warehouse-fulfilled orders only —
                direct-shipment orders keep their own OBD-19 supplier→buyer flow. */}
            {!order.direct && (
              <KV k="Method">
                {order.deliveryMethod === "managed" ? "Smash Pro delivery (free)"
                  : order.deliveryMethod === "self-pickup" ? "Self-pickup from warehouse"
                  : "Self-arranged courier"}
              </KV>
            )}
            <KV k={!order.direct && order.deliveryMethod === "self-pickup" ? "Pickup location" : "Ship to"}>
              {!order.direct && order.deliveryMethod === "self-pickup" ? (order.pickupNote ?? order.shipTo) : order.shipTo}
            </KV>
            {order.dispatched && (
              <KV k="Dispatched">{order.dispatched} · transport ref <span className="font-mono text-[12.5px]">{order.transportRef}</span></KV>
            )}
            {order.deliveredOn && (
              <KV k="Delivered">{order.deliveredOn}{order.deliveryProofOnRecord ? " · proof on record" : ""}</KV>
            )}
            {order.direct && (
              <KV k="Receipt">
                {confirmed ? <Chip tone="ok">Confirmed by you</Chip> : <Chip tone="warn">Awaiting your confirmation</Chip>}
              </KV>
            )}
            {!order.dispatched && order.status !== "cancelled" && (
              <KV k="Dispatch">After payment confirmation (100% advance — OBD-08)</KV>
            )}
            {order.status === "cancelled" && (
              <KV k="Outcome">Cancelled — payment window closed; reserved stock released</KV>
            )}
          </Panel>
          {order.direct && (
            <NoteFlag className="mt-2">
              confirmation request sent only after delivery proof upload
              (obd-19 proof-first) · non-response &amp; dispute handling pending obd-19 ◇
            </NoteFlag>
          )}

          <Sect id="report">Something wrong?</Sect>
          <Panel className="p-4">
            <p className="mb-3 text-sm">
              Delayed, damaged, lost or missing items? Report it to Smash Pro —
              we are your single point of contact and will coordinate the
              resolution.
            </p>
            {issueSent ? (
              <Banner tone="ok">
                <b className="text-ink">Report received.</b> Smash Pro will
                investigate and coordinate the resolution — you will not be
                referred to any third party.
              </Banner>
            ) : issueOpen ? (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="issue">What went wrong?</label>
                <textarea
                  id="issue" rows={3}
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="e.g. Two cartons arrived damaged; contents intact…"
                  className="mb-3 w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400"
                />
                <button
                  onClick={() => void submitIssue()}
                  disabled={!issueText.trim() || busy}
                  className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
                >
                  {busy ? "Submitting…" : "Submit report"}
                </button>
                <NoteFlag className="mt-2">
                  liability, recovery &amp; compensation policies pending obd-19 ◇
                </NoteFlag>
              </div>
            ) : (
              <button
                onClick={() => setIssueOpen(true)}
                className="inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink"
              >
                Report a delivery issue
              </button>
            )}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <GstCard
            subtotal={order.subtotalExGst} gst={order.gst} shipping={order.shipping}
            total={order.total}
            totalLabel={paid ? "Total paid (incl. GST)" : "Total payable (incl. GST)"}
          />

          <Panel className="mt-3.5">
            <PanelHead title="Payment" />
            <div className="px-4 py-3">
              <KV k="Method">{order.payment.method}</KV>
              {order.payment.reference && (
                <KV k="Reference"><span className="font-mono text-[12.5px]">{order.payment.reference}</span></KV>
              )}
              {order.payment.confirmedAt && <KV k="Confirmed">{order.payment.confirmedAt}</KV>}
              {order.payment.proofUploadedAt && <KV k="Proof uploaded">{order.payment.proofUploadedAt}</KV>}
              <KV k="Status">
                <Chip tone={paid ? "ok" : order.payment.status === "awaiting-verification" ? "warn" : "bad"}>
                  {order.payment.statusLabel}
                </Chip>
              </KV>
            </div>
          </Panel>

          <Panel className="mt-3.5">
            <PanelHead title="Documents" aside={<NoteFlag>prototype — not functional</NoteFlag>} />
            {paid ? (
              <>
                <DocRow file={`Tax invoice — ${order.id}`} meta="PDF"
                  action={<span className="cursor-not-allowed text-[13px] font-semibold text-n400" aria-disabled>Download (prototype)</span>} />
                <DocRow file="Payment receipt" meta="PDF"
                  action={<span className="cursor-not-allowed text-[13px] font-semibold text-n400" aria-disabled>Download (prototype)</span>} />
              </>
            ) : (
              <div className="px-4 py-3 text-sm text-n600">Documents appear after payment confirmation.</div>
            )}
          </Panel>
          <NoteFlag className="mt-2">
            amounts illustrative · invoice generation/download is a design
            reference only — timing &amp; format pending obd-11 approval; no
            production workflow implemented
          </NoteFlag>
        </div>
      </div>

      <Sect>Reorder</Sect>
      <Panel className="p-4">
        <p className="mb-3 text-sm text-n600">
          Add every line from this order to your cart again — current prices and
          availability apply, and anything no longer available is skipped.
        </p>
        <BuyerReorderButton orderId={order.id} />
      </Panel>

      <div className="mt-8">
        <Link href="/orders" className="text-sm font-semibold text-ember-deep hover:underline">← Back to orders</Link>
      </div>
    </>
  );
}
