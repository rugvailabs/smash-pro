"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, Chip, GstCard, KV, NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import type { Order } from "@/lib/types";

/* ============================================================
   Payment result for a REAL order (integration point I3).
   States per OBD-21: online methods are auto-confirmed in the
   demo (no gateway selected — ADR-0006, clearly labelled);
   NEFT/RTGS/cheque follow the decided path — proof upload
   (metadata only, ADR-0005) then admin verification flips the
   payment to confirmed. Copy never states a timeout duration
   (OBD-21 ◇).
   ============================================================ */

function ProofUpload({ orderId, hasProof }: { orderId: string; hasProof: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [staged, setStaged] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasProof) return null;
  return (
    <Panel className="mt-3.5 p-4">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[.08em] text-n600">
        Upload payment proof — UTR receipt · cheque image
      </div>
      <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">
          Choose file
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setStaged(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {staged && <span className="font-mono text-xs text-ink">{staged}</span>}
        <button
          disabled={!staged || busy}
          onClick={() => {
            if (!staged) return;
            setBusy(true);
            setError(null);
            fetch(`/api/orders/${orderId}/proof`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ filename: staged }),
            })
              .then(async (r) => {
                if (r.ok) {
                  toast("Payment proof recorded — awaiting admin verification.");
                  router.refresh();
                } else {
                  const data = (await r.json().catch(() => null)) as { error?: string } | null;
                  setError(data?.error ?? "The proof could not be recorded — please try again.");
                }
              })
              .catch(() => setError("The proof could not be recorded — check your connection and try again."))
              .finally(() => setBusy(false));
          }}
          className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
        >
          {busy ? "Recording…" : "Submit proof"}
        </button>
      </div>
      {error && <Banner tone="bad" className="mt-2.5">{error}</Banner>}
      <NoteFlag className="mt-2">
        file metadata only is retained in this phase (adr-0005) · verification
        is performed by prosmash operations (obd-21)
      </NoteFlag>
    </Panel>
  );
}

export function PaymentResult({ order }: { order: Order }) {
  const pay = order.payment;
  const confirmed = pay.status === "confirmed";

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      <div>
        {confirmed ? (
          <Banner tone="ok">
            <b className="text-ink">Payment confirmed.</b>{" "}
            {["UPI", "Card", "Net Banking"].includes(pay.method)
              ? "Confirmed automatically in this demo environment (gateway selection pending OBD-21)."
              : "Verified by ProSmash operations."}{" "}
            Your order has moved to processing.
            {pay.reference && <> <span className="font-mono text-xs">{pay.reference}</span></>}
          </Banner>
        ) : (
          <Banner tone="warn">
            <b className="text-ink">Awaiting verification.</b> NEFT/RTGS and
            cheque payments count as confirmed only after ProSmash reviews the
            uploaded proof — dispatch follows confirmed payment (OBD-08).
          </Banner>
        )}

        {!confirmed && <ProofUpload orderId={order.id} hasProof={Boolean(pay.proofFile)} />}
        {!confirmed && pay.proofFile && (
          <Panel className="mt-3.5 p-4 text-sm">
            <KV k="Proof on record"><span className="font-mono text-[12.5px]">{pay.proofFile}</span></KV>
            {pay.proofUploadedAt && <KV k="Uploaded">{pay.proofUploadedAt}</KV>}
            <KV k="Status"><Chip tone="warn">Awaiting verification</Chip></KV>
          </Panel>
        )}

        <NoteFlag className="mt-3.5">
          amounts illustrative · payment-window defaults pending OBD-21 ◇ —
          copy never states a duration · demo environment, no money moves
        </NoteFlag>
      </div>

      <div className="lg:sticky lg:top-[132px]">
        <GstCard
          subtotal={order.subtotalExGst}
          gst={order.gst}
          shipping={order.shipping}
          total={order.total}
        />
        <Panel className="mt-3.5">
          <PanelHead title="Order status" />
          <div className="px-4 py-3">
            <KV k="Order"><span className="font-mono text-[12.5px]">{order.id}</span></KV>
            <KV k="Method">{pay.method}</KV>
            <KV k="Status">
              {confirmed
                ? <Chip tone="ok">Payment confirmed</Chip>
                : <Chip tone="warn">{pay.statusLabel}</Chip>}
            </KV>
          </div>
        </Panel>
        <Link
          href={`/orders/${order.id}`}
          className="mt-3.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press"
        >
          View order {order.id}
        </Link>
        <Link
          href="/orders"
          className="mt-2.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
        >
          All orders
        </Link>
      </div>
    </div>
  );
}
