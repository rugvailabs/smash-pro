"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, NoteFlag, Panel } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";

/* ============================================================
   Quotation revision + withdrawal (Workflow E), real endpoints.
   A revision appends a NEW immutable quotation version — the
   current offer is prefilled so the supplier edits from it.
   Withdrawal retires an owned quotation (blocked once awarded).
   ============================================================ */

interface CurrentOffer {
  unit: number;
  quantity: string;
  lead: string;
  validTill: string;
  terms: string;
}

export function SupplierRevisionForm({ reqId, current }: { reqId: string; current: CurrentOffer }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    price: String(current.unit),
    qty: current.quantity,
    lead: current.lead,
    valid: current.validTill,
    terms: current.terms,
    notes: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/quotes/${reqId}/revise`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          unit: parseFloat(form.price) || 0,
          quantity: form.qty,
          lead: form.lead,
          validTill: form.valid,
          terms: form.terms,
          note: form.notes.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { version?: number; error?: string } | null;
      if (!res.ok || !data?.version) {
        setError(data?.error ?? "The revision could not be submitted.");
        return;
      }
      toast(`Quotation v${data.version} submitted on ${reqId}.`);
      setOpen(false);
      router.refresh();
    } catch {
      setError("The revision could not be submitted — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const price = parseFloat(form.price) || 0;
  const qty = parseInt(form.qty) || 0;
  const input = "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
  const label = "mb-1.5 block text-[13px] font-medium text-ink";

  if (!open) {
    return (
      <Panel className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink">Revise your quotation</div>
          <div className="text-[13px] text-n600">
            Submit a new version while this requirement is open — every version is
            kept on record and nothing is overwritten.
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press"
        >
          Submit revision
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="p-5">
      <NoteFlag className="mb-3.5">
        a revision is a new immutable version (sup-007) — the current offer is
        prefilled below
      </NoteFlag>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="r-price">Unit price, incl. GST where applicable (required)</label>
          <input id="r-price" type="number" min={0} step="0.01" className={`${input} num`} value={form.price} onChange={set("price")} />
        </div>
        <div>
          <label className={label} htmlFor="r-qty">Quantity offered (required)</label>
          <input id="r-qty" type="text" className={input} value={form.qty} onChange={set("qty")} />
        </div>
        <div>
          <label className={label} htmlFor="r-lead">Lead time (required)</label>
          <input id="r-lead" type="text" className={input} value={form.lead} onChange={set("lead")} />
        </div>
        <div>
          <label className={label} htmlFor="r-valid">Quotation valid till (required)</label>
          <input id="r-valid" type="text" className={input} value={form.valid} onChange={set("valid")} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="r-terms">Requested payment terms</label>
          <input id="r-terms" type="text" className={input} value={form.terms} onChange={set("terms")} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="r-notes">What changed in this revision</label>
          <textarea id="r-notes" rows={2} value={form.notes} onChange={set("notes")}
            placeholder="e.g. improved lead time to 14 days"
            className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400" />
        </div>
      </div>
      <Banner tone="info" className="mt-3.5">
        <b className="text-ink">New line total {inr(price * qty)}</b> at {inr(price)} × {qty || "—"}.
      </Banner>
      {error && (
        <p role="alert" className="mt-3.5 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => void submit()}
          disabled={busy || !(price > 0) || !form.qty.trim() || !form.lead.trim() || !form.valid.trim()}
          className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
        >
          {busy ? "Submitting…" : "Submit revision"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
        >
          Cancel
        </button>
      </div>
    </Panel>
  );
}

export function SupplierWithdraw({ reqId }: { reqId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = async () => {
    if (busy) return;
    if (!window.confirm(`Withdraw your quotation on ${reqId}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/quotes/${reqId}/withdraw`, { method: "POST" });
      if (res.ok) {
        toast(`Quotation on ${reqId} withdrawn.`);
        router.push("/supplier/quotes");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not withdraw — it may already be awarded.");
      }
    } catch {
      setError("Could not withdraw — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={() => void withdraw()}
        disabled={busy}
        className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:text-n400"
      >
        {busy ? "Withdrawing…" : "Withdraw quotation"}
      </button>
      {error && <span role="alert" className="text-[11px] text-bad">{error}</span>}
    </span>
  );
}
