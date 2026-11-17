"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, NoteFlag, Panel } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";

/* ============================================================
   Dispatch / delivery scheduling (DIRECT POs): acknowledged →
   awaiting-proof. Records the dispatch date, transport LR
   reference and quantity shipped — real endpoint. Replaces the
   "Update dispatch (prototype)" interaction. Dispatch documents
   (invoice, e-way bill) remain pending confirmation (OBD-19).
   ============================================================ */

export function SupplierDispatchForm({ poId, lineQty }: { poId: string; lineQty: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    dispatched: "",
    lr: "",
    qtyShipped: `${lineQty} of ${lineQty}`,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/pos/${poId}/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dispatched: form.dispatched.trim(),
          lr: form.lr.trim(),
          qtyShipped: form.qtyShipped.trim(),
        }),
      });
      if (res.ok) {
        toast(`Dispatch recorded on ${poId}.`);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not record dispatch — please try again.");
      }
    } catch {
      setError("Could not record dispatch — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const ready = form.dispatched.trim() && form.lr.trim() && form.qtyShipped.trim();
  const input = "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
  const label = "mb-1.5 block text-[13px] font-medium text-ink";

  return (
    <Panel className="p-4">
      <Banner tone="warn" className="mb-3.5">
        <b className="text-ink">Record dispatch to advance this direct shipment.</b>{" "}
        Once recorded, the PO moves to awaiting delivery proof — upload proof
        next to close the shipment.
      </Banner>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="d-date">Dispatch date (required)</label>
          <input id="d-date" type="text" placeholder="e.g. 02 Dec 2026" className={input} value={form.dispatched} onChange={set("dispatched")} />
        </div>
        <div>
          <label className={label} htmlFor="d-lr">Transport LR / docket no. (required)</label>
          <input id="d-lr" type="text" placeholder="e.g. LR-884217" className={`${input} font-mono`} value={form.lr} onChange={set("lr")} />
        </div>
        <div>
          <label className={label} htmlFor="d-qty">Quantity shipped (required)</label>
          <input id="d-qty" type="text" className={input} value={form.qtyShipped} onChange={set("qtyShipped")} />
        </div>
      </div>
      <NoteFlag className="mt-2.5">
        partial shipments &amp; dispatch documents (invoice, e-way bill) pending
        confirmation (obd-19)
      </NoteFlag>
      {error && (
        <p role="alert" className="mt-3 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
      )}
      <button
        onClick={() => void submit()}
        disabled={busy || !ready}
        className="mt-3 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
      >
        {busy ? "Recording…" : "Record dispatch"}
      </button>
    </Panel>
  );
}
