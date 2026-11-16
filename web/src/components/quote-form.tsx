"use client";

import { useState } from "react";
import { Banner, KV, NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { inr } from "@/lib/format";

/* ============================================================
   Quotation submission — SUP-006 · Workflow E step 1. Fields are
   the APPROVED quotation fields only: unit price, quantity, lead
   time, validity, requested payment terms, notes + attachments.
   No quote-discount field exists in the approved model.
   Submission is a prototype interaction; the offer summary is a
   live calculation.
   ============================================================ */

export function QuoteForm() {
  const [form, setForm] = useState({
    price: "2340", qty: "120", lead: "18 days from PO",
    valid: "05 Dec 2026", terms: "50% advance, balance on delivery",
    notes: "Frames powder-coated in-house; sample unit available on request.",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const price = parseFloat(form.price) || 0;
  const qty = parseInt(form.qty) || 0;

  const input = "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
  const label = "mb-1.5 block text-[13px] font-medium text-ink";
  const help = "mt-1 text-xs text-n600";

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      <Panel className="p-5">
        <NoteFlag className="mb-3.5">
          visual prototype — submission &amp; upload are non-functional preview interactions
        </NoteFlag>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="q-price">Unit price, incl. GST where applicable (required)</label>
            <input id="q-price" type="number" min={0} step="0.01" className={`${input} num`} value={form.price} onChange={set("price")} />
            <p className={help}>Line total auto-calculates at quoted quantity</p>
          </div>
          <div>
            <label className={label} htmlFor="q-qty">Quantity offered (required)</label>
            <input id="q-qty" type="number" min={1} className={input} value={form.qty} onChange={set("qty")} />
            <p className={help}>Partial-quantity quotes: policy pending confirmation</p>
          </div>
          <div>
            <label className={label} htmlFor="q-lead">Lead time (required)</label>
            <input id="q-lead" type="text" className={input} value={form.lead} onChange={set("lead")} />
          </div>
          <div>
            <label className={label} htmlFor="q-valid">Quotation valid till (required)</label>
            <input id="q-valid" type="text" className={input} value={form.valid} onChange={set("valid")} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="q-terms">Requested payment terms</label>
            <input id="q-terms" type="text" className={input} value={form.terms} onChange={set("terms")} />
            <p className={help}>Terms are part of your offer — allowed-terms policy pending confirmation</p>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="q-notes">Notes</label>
            <textarea id="q-notes" rows={3} value={form.notes} onChange={set("notes")}
              className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink" />
          </div>
          <div className="sm:col-span-2">
            <span className={label}>Attachments (specs, certificates, sample photos)</span>
            <div className="rounded-[2px] border border-dashed border-n400 bg-paper px-4 py-6 text-center text-sm text-n600">
              Drag files here, or <b className="text-ink">browse</b>
              <NoteFlag className="mt-1.5">non-functional prototype</NoteFlag>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="inline-flex h-11 cursor-not-allowed items-center rounded-[2px] bg-n200 px-5 text-sm font-semibold text-n400" aria-disabled>
            Submit quotation (prototype)
          </button>
          <button className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink">
            Save draft
          </button>
        </div>
      </Panel>

      <div className="lg:sticky lg:top-[132px]">
        <Panel>
          <PanelHead title="Offer summary" />
          <div className="px-4 py-3">
            <KV k="Unit price"><span className="num">{inr(price)}</span></KV>
            <KV k="Quantity"><span className="num">{qty}</span></KV>
            <KV k="Line total"><b className="num">{inr(price * qty)}</b></KV>
            <KV k="Lead time">{form.lead}</KV>
            <KV k="Valid till">{form.valid}</KV>
          </div>
        </Panel>
        <Banner tone="info" className="mt-3">
          <b className="text-ink">Revisions are versioned.</b> You can revise
          this quotation while the requirement is open — every version is kept
          on record and visible to you and ProSmash.
        </Banner>
      </div>
    </div>
  );
}
