"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { inputCls, labelCls, btnEmber } from "@/components/admin-ui";
import { inr } from "@/lib/format";
import type { AdminInvoiceablePo } from "@/lib/admin-types";

/* ============================================================
   Generate a supplier invoice record from one or more purchase
   order lines belonging to the same requirement award. Every
   GST/HSN figure is admin-entered, transcribing the supplier's own
   paper/PDF invoice — this form computes arithmetic only (taxable
   value, CGST/SGST/IGST split, round-off), never a tax rate or
   classification decision. See server/admin.ts invoice section.
   ============================================================ */

interface Line {
  poId: string;
  selected: boolean;
  description: string;
  hsn: string;
  uom: string;
  rate: string;
  disc: string;
  gstPercent: string;
}

export function InvoiceGenerateForm({
  reqId, pos, suggestedIntra,
}: {
  reqId: string;
  pos: AdminInvoiceablePo[];
  suggestedIntra: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [header, setHeader] = useState({
    supplierInvoiceNo: "", supplierInvoiceDate: "",
    placeOfSupply: "", transportMode: "", paymentTerms: "",
  });
  const [taxMode, setTaxMode] = useState<"intra" | "inter">(suggestedIntra ? "intra" : "inter");
  const [lines, setLines] = useState<Line[]>(
    pos.map((p) => ({
      poId: p.id, selected: true, description: p.lineName, hsn: "", uom: "Pcs",
      rate: String(p.unit), disc: "0", gstPercent: "",
    }))
  );

  if (pos.length === 0) {
    return (
      <Panel className="p-5">
        <p className="text-sm text-n600">
          Every purchase order line for this requirement already has an invoice recorded.
        </p>
      </Panel>
    );
  }

  const setH = (k: keyof typeof header) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setHeader({ ...header, [k]: e.target.value });
  const setLine = (poId: string, k: keyof Line) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLines(lines.map((l) => (l.poId === poId ? { ...l, [k]: e.target.value } : l)));
  const toggleLine = (poId: string) =>
    setLines(lines.map((l) => (l.poId === poId ? { ...l, selected: !l.selected } : l)));

  const poQty = new Map(pos.map((p) => [p.id, p.lineQty]));
  const selectedLines = lines.filter((l) => l.selected);
  const grandTotal = selectedLines.reduce((sum, l) => {
    const qty = poQty.get(l.poId) ?? 0;
    const rate = parseFloat(l.rate) || 0;
    const disc = parseFloat(l.disc) || 0;
    const taxable = Math.max(0, rate * qty - disc);
    const gst = parseFloat(l.gstPercent) || 0;
    return sum + taxable + (taxable * gst) / 100;
  }, 0);

  const canSubmit =
    !busy && selectedLines.length > 0 &&
    header.supplierInvoiceNo.trim().length > 0 && header.supplierInvoiceDate.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reqId,
          supplierInvoiceNo: header.supplierInvoiceNo.trim(),
          supplierInvoiceDate: header.supplierInvoiceDate.trim(),
          placeOfSupply: header.placeOfSupply.trim(),
          transportMode: header.transportMode.trim(),
          paymentTerms: header.paymentTerms.trim(),
          taxMode,
          lines: selectedLines.map((l) => ({
            poId: l.poId, description: l.description.trim(), hsn: l.hsn.trim() || null,
            qty: poQty.get(l.poId) ?? 0, uom: l.uom.trim() || "Pcs",
            rate: parseFloat(l.rate) || 0, disc: parseFloat(l.disc) || 0,
            gstPercent: l.gstPercent.trim() ? parseFloat(l.gstPercent) : null,
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok || !data?.id) {
        setError(data?.error ?? "The invoice could not be recorded.");
        return;
      }
      router.push(`/admin/invoices/${data.id}`);
    } catch {
      setError("The invoice could not be recorded — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[8fr_4fr]">
      <div className="min-w-0">
        <Panel className="p-4">
          <PanelHead title="Supplier's invoice details" />
          <div className="grid gap-3.5 p-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="inv-no">Supplier&rsquo;s invoice number (required)</label>
              <input id="inv-no" type="text" value={header.supplierInvoiceNo} onChange={setH("supplierInvoiceNo")}
                placeholder="e.g. PS26-27/00014791" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inv-date">Supplier&rsquo;s invoice date (required)</label>
              <input id="inv-date" type="text" value={header.supplierInvoiceDate} onChange={setH("supplierInvoiceDate")}
                placeholder="DD MMM YYYY" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inv-pos">Place of supply</label>
              <input id="inv-pos" type="text" value={header.placeOfSupply} onChange={setH("placeOfSupply")}
                placeholder="e.g. Karnataka" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inv-transport">Transport mode</label>
              <input id="inv-transport" type="text" value={header.transportMode} onChange={setH("transportMode")}
                placeholder="e.g. Road / courier name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inv-terms">Payment terms</label>
              <input id="inv-terms" type="text" value={header.paymentTerms} onChange={setH("paymentTerms")}
                placeholder="e.g. 50% advance, balance on delivery" className={inputCls} />
            </div>
            <div>
              <span className={labelCls}>Tax type</span>
              <div className="flex h-10 items-center gap-4">
                <label className="inline-flex items-center gap-1.5 text-sm text-ink">
                  <input type="radio" checked={taxMode === "intra"} onChange={() => setTaxMode("intra")} />
                  CGST + SGST (same state)
                </label>
                <label className="inline-flex items-center gap-1.5 text-sm text-ink">
                  <input type="radio" checked={taxMode === "inter"} onChange={() => setTaxMode("inter")} />
                  IGST (different state)
                </label>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="mt-5">
          <PanelHead title="Purchase order lines" />
          <div className="divide-y divide-n100">
            {lines.map((l) => {
              const po = pos.find((p) => p.id === l.poId)!;
              return (
                <div key={l.poId} className="p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                    <input type="checkbox" checked={l.selected} onChange={() => toggleLine(l.poId)} />
                    <span className="font-mono text-[12px] text-n600">{po.id}</span>
                    <span>{po.lineName}</span>
                    <span className="ml-auto font-mono text-[12px] text-n600">qty {po.lineQty} · {inr(po.unit)}/unit</span>
                  </label>
                  {l.selected && (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor={`d-${l.poId}`}>Description</label>
                        <input id={`d-${l.poId}`} type="text" value={l.description} onChange={setLine(l.poId, "description")} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor={`h-${l.poId}`}>HSN/SAC</label>
                        <input id={`h-${l.poId}`} type="text" value={l.hsn} onChange={setLine(l.poId, "hsn")} placeholder="4–8 digits" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor={`u-${l.poId}`}>UOM</label>
                        <input id={`u-${l.poId}`} type="text" value={l.uom} onChange={setLine(l.poId, "uom")} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor={`g-${l.poId}`}>GST %</label>
                        <input id={`g-${l.poId}`} type="number" min={0} max={100} step="0.01" value={l.gstPercent} onChange={setLine(l.poId, "gstPercent")} placeholder="0" className={`${inputCls} num`} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor={`r-${l.poId}`}>Rate (₹)</label>
                        <input id={`r-${l.poId}`} type="number" min={0} step="0.01" value={l.rate} onChange={setLine(l.poId, "rate")} className={`${inputCls} num`} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor={`dc-${l.poId}`}>Discount (₹)</label>
                        <input id={`dc-${l.poId}`} type="number" min={0} step="0.01" value={l.disc} onChange={setLine(l.poId, "disc")} className={`${inputCls} num`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
        <NoteFlag className="mt-2.5">
          hsn/gst % are admin-entered, transcribed from the supplier&rsquo;s own
          invoice — not computed or validated by smash pro (obd-11/obd-20
          pending professional tax validation)
        </NoteFlag>
      </div>

      <div className="lg:sticky lg:top-[132px]">
        <Panel>
          <PanelHead title="Summary" />
          <div className="px-4 py-3">
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[13px] text-n600">Lines selected</span>
              <span className="num text-sm font-semibold text-ink">{selectedLines.length}</span>
            </div>
            <div className="flex items-baseline justify-between py-1">
              <span className="text-[13px] text-n600">Estimated total</span>
              <b className="num text-base text-ink">{inr(grandTotal)}</b>
            </div>
          </div>
        </Panel>
        {error && (
          <p role="alert" className="mt-3 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
        )}
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-3 w-full justify-center`}>
          {busy ? "Recording…" : "Record invoice"}
        </button>
      </div>
    </div>
  );
}
