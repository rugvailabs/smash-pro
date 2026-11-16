"use client";

import { useState } from "react";
import { Banner, Chip, KV, NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import type { SupplierPO } from "@/lib/types";

/* ============================================================
   Delivery proof — SUP-009 AC3 · OBD-19. The delivery panel shows
   EXACTLY the decided Minimum Delivery Information set — nothing
   else about the buyer or order. Proof-first (Option A): the
   recipient's confirmation is requested only after proof upload.
   Submission is a demo interaction (no file is transmitted).
   ============================================================ */

export function DeliveryProof({ po }: { po: SupplierPO }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      {submitted ? (
        <Banner tone="ok" className="mb-5">
          <b className="text-ink">Delivery proof on record.</b> ProSmash has
          now requested the recipient&rsquo;s confirmation — proof first,
          always. <span className="font-mono text-[10px] uppercase text-n600">demo interaction — resets on reload</span>
        </Banner>
      ) : (
        <Banner tone="warn" className="mb-5">
          <b className="text-ink">Upload delivery proof to close this
          shipment.</b> The recipient&rsquo;s confirmation is requested by
          ProSmash only after your proof is on record — proof first, always.
        </Banner>
      )}

      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Delivery information — minimum set (OBD-19)</Sect>
          <Panel className="px-4 py-3">
            {(po.minDeliveryInfo ?? []).map(([k, v]) => (
              <KV key={k} k={k}>
                {k === "Phone" || k === "PO reference" ? <span className="font-mono text-[12.5px]">{v}</span> : <span className={k === "Quantity" ? "num" : ""}>{v}</span>}
              </KV>
            ))}
          </Panel>
          <NoteFlag className="mt-2">
            this is the complete disclosure — no other buyer information is
            shared with suppliers · all recipient details illustrative
          </NoteFlag>

          <Sect>Upload proof — POD · photographs · signed receipt</Sect>
          <Panel className="p-4">
            {!submitted ? (
              <>
                <div className="rounded-[2px] border border-dashed border-n400 bg-paper px-4 py-6 text-center text-sm text-n600">
                  Drag your proof of delivery here, or <b className="text-ink">browse</b>
                  <NoteFlag className="mt-1.5">accepted: pod, delivery photos, signed receipt · non-functional prototype</NoteFlag>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-n100 pt-3 text-sm">
                  <span className="font-mono text-[12.5px] text-ink">pod-lr-90233-signed.jpg</span>
                  <span className="text-xs text-n600">staged (demo)</span>
                  <span className="ml-auto"><Chip tone="neu">Ready to submit</Chip></span>
                </div>
                <button
                  onClick={() => setSubmitted(true)}
                  className="mt-3 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press"
                >
                  Submit proof (demo)
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-[12.5px] text-ink">pod-lr-90233-signed.jpg</span>
                <span className="text-xs text-n600">submitted just now (demo)</span>
                <span className="ml-auto"><Chip tone="ok">On record</Chip></span>
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <Panel>
            <PanelHead title="Shipment" />
            <div className="px-4 py-3">
              <KV k="Dispatched">{po.shipment?.dispatched} · LR <span className="font-mono text-[12.5px]">{po.shipment?.lr}</span></KV>
              <KV k="Quantity shipped"><span className="num">{po.shipment?.qtyShipped}</span></KV>
              <KV k="Proof">
                {submitted ? <Chip tone="ok">On record</Chip> : <Chip tone="warn">Not yet submitted</Chip>}
              </KV>
              <KV k="Recipient confirmation">
                {submitted ? <Chip tone="info">Requested by ProSmash</Chip> : <Chip tone="neu">Waits for proof</Chip>}
              </KV>
            </div>
          </Panel>
          <Banner tone="info" className="mt-3.5">
            <b className="text-ink">ProSmash owns the delivery relationship.</b>{" "}
            If the recipient raises any delivery issue, ProSmash coordinates it
            with you — never handle delivery complaints directly.
          </Banner>
          <NoteFlag className="mt-2.5">
            pod validation &amp; retention, confirmation deadlines and dispute
            handling pending (obd-19 ◇) · dispatch documents pending
            confirmation
          </NoteFlag>
        </div>
      </div>
    </>
  );
}
