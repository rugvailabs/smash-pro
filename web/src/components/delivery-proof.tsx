"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, Chip, KV, NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import type { SupplierPO } from "@/lib/types";

/* ============================================================
   Delivery proof — SUP-009 AC3 · OBD-19, now REAL (integration
   point I4): submission records the proof METADATA (ADR-0005 —
   file bytes are not retained in this phase) and flips the PO to
   delivered-proof server-side. The delivery panel shows EXACTLY
   the decided Minimum Delivery Information set — nothing else.
   Proof-first (Option A): the recipient's confirmation is
   requested only after proof is on record.
   ============================================================ */

export function DeliveryProof({ po }: { po: SupplierPO }) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Staged file NAME only — bytes are not read or transmitted (ADR-0005).
  // No default: proof can only be submitted for a genuinely chosen file.
  const [staged, setStaged] = useState<string | null>(null);

  const stage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setStaged(f.name); setError(null); }
  };

  const submit = async () => {
    if (busy || !staged) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/pos/${po.id}/proof`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: staged }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast(`Delivery proof recorded on ${po.id}.`);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "The proof could not be recorded — please try again.");
      }
    } catch {
      setError("The proof could not be recorded — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {submitted ? (
        <Banner tone="ok" className="mb-5">
          <b className="text-ink">Delivery proof on record.</b> Smash Pro has
          now requested the recipient&rsquo;s confirmation — proof first,
          always.
        </Banner>
      ) : (
        <Banner tone="warn" className="mb-5">
          <b className="text-ink">Upload delivery proof to close this
          shipment.</b> The recipient&rsquo;s confirmation is requested by
          Smash Pro only after your proof is on record — proof first, always.
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
                  <NoteFlag className="mt-1.5">accepted: pod, delivery photos, signed receipt · metadata only is retained (adr-0005)</NoteFlag>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink md:hidden">
                    Take photo
                    <input
                      type="file" accept="image/*" capture="environment"
                      className="hidden" onChange={stage}
                    />
                  </label>
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">
                    Choose file
                    <input
                      type="file" accept="image/*,.pdf"
                      className="hidden" onChange={stage}
                    />
                  </label>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-n100 pt-3 text-sm">
                  {staged ? (
                    <>
                      <span className="font-mono text-[12.5px] text-ink">{staged}</span>
                      <span className="text-xs text-n600">staged</span>
                      <span className="ml-auto"><Chip tone="neu">Ready to submit</Chip></span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] text-n600">No file chosen yet</span>
                      <span className="ml-auto"><Chip tone="warn">Choose a file first</Chip></span>
                    </>
                  )}
                </div>
                {error && (
                  <Banner tone="bad" className="mt-3">{error}</Banner>
                )}
                <button
                  onClick={() => void submit()}
                  disabled={busy || !staged}
                  aria-disabled={busy || !staged}
                  className="mt-3 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
                >
                  {busy ? "Recording…" : "Submit proof"}
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-[12.5px] text-ink">{staged}</span>
                <span className="text-xs text-n600">submitted just now</span>
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
                {submitted ? <Chip tone="info">Requested by Smash Pro</Chip> : <Chip tone="neu">Waits for proof</Chip>}
              </KV>
            </div>
          </Panel>
          <Banner tone="info" className="mt-3.5">
            <b className="text-ink">Smash Pro owns the delivery relationship.</b>{" "}
            If the recipient raises any delivery issue, Smash Pro coordinates it
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
