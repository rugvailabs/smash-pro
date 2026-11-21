import { inr } from "@/lib/format";
import { amountInWords } from "@/lib/number-words";
import type { AdminInvoiceDetail } from "@/lib/admin-types";

/* ============================================================
   The invoice document itself — print-perfect, in the structure
   of a standard Indian GST tax invoice (seller/buyer letterhead,
   HSN-coded line items, CGST/SGST/IGST split, HSN-wise tax
   summary, amount in words). Shared by the admin detail view and
   the standalone print route so both render byte-identical output.

   RECORD-KEEPING ONLY: every GST/HSN/tax figure here is admin-
   entered, transcribing the supplier's own invoice (ADR-0014
   convention) — this component only does arithmetic (sums,
   rounding), never a tax rate or classification decision. Still
   pending OBD-11/OBD-20 professional tax validation.
   ============================================================ */

const cell = "border border-ink/20 px-2 py-1.5 align-top";
const head = `${cell} bg-paper font-mono text-[9px] uppercase tracking-wide text-n600 font-normal`;

export function InvoiceDocument({ inv }: { inv: AdminInvoiceDetail }) {
  const hsnGroups = new Map<string, { taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const l of inv.lines) {
    const key = l.hsn || "—";
    const g = hsnGroups.get(key) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    g.taxable += l.taxableValue; g.cgst += l.cgst; g.sgst += l.sgst; g.igst += l.igst;
    hsnGroups.set(key, g);
  }
  const totalTax = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;

  return (
    <div className="mx-auto max-w-[920px] border border-ink/20 bg-white p-6 text-[12.5px] text-ink print:border-0 print:p-0">
      <div className="mb-3 flex items-center justify-between border-b border-ink/20 pb-2">
        <h1 className="font-display text-lg font-semibold">Tax Invoice</h1>
        <span className="font-mono text-[10px] uppercase tracking-wide text-n600">
          Internal reference {inv.id}
        </span>
      </div>

      <div className="grid grid-cols-2 border border-ink/20">
        <div className={`${cell} border-r`}>
          <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Seller</div>
          <b>{inv.seller.legalName}</b>
          <div className="whitespace-pre-wrap">{inv.seller.address || "—"}</div>
          {inv.seller.phone && <div>Mob/Phone: {inv.seller.phone}</div>}
          {inv.seller.email && <div>Email: {inv.seller.email}</div>}
          <div>GSTIN: {inv.seller.gstin || "—"}</div>
        </div>
        <div className={cell}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Invoice No.</div>
              <b>{inv.supplierInvoiceNo}</b>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Dated</div>
              <b>{inv.supplierInvoiceDate}</b>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Transport mode</div>
              {inv.transportMode || "—"}
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Payment terms</div>
              {inv.paymentTerms || "—"}
            </div>
            <div className="col-span-2">
              <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Place of supply</div>
              {inv.placeOfSupply || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border border-t-0 border-ink/20">
        <div className={`${cell} border-r`}>
          <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Consignee (shipped to)</div>
          <b>{inv.buyer.legalName}</b>
          <div className="whitespace-pre-wrap">{inv.buyer.address}</div>
          <div>GSTIN: {inv.buyer.gstin} · PAN: {inv.buyer.pan}</div>
        </div>
        <div className={cell}>
          <div className="font-mono text-[9px] uppercase tracking-wide text-n600">Buyer (billed to)</div>
          <b>{inv.buyer.legalName}</b>
          <div className="whitespace-pre-wrap">{inv.buyer.address}</div>
          <div>GSTIN: {inv.buyer.gstin} · PAN: {inv.buyer.pan}</div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className={head}>Sr</th>
              <th className={head}>Description of goods</th>
              <th className={head}>HSN/SAC</th>
              <th className={`${head} text-right`}>Qty</th>
              <th className={head}>UOM</th>
              <th className={`${head} text-right`}>Rate</th>
              <th className={`${head} text-right`}>Disc.</th>
              <th className={`${head} text-right`}>Taxable amt.</th>
              <th className={`${head} text-right`}>GST %</th>
              {inv.taxMode === "intra" ? (
                <>
                  <th className={`${head} text-right`}>CGST</th>
                  <th className={`${head} text-right`}>SGST</th>
                </>
              ) : (
                <th className={`${head} text-right`}>IGST</th>
              )}
              <th className={`${head} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i}>
                <td className={cell}>{i + 1}</td>
                <td className={cell}>{l.description}</td>
                <td className={cell}>{l.hsn || "—"}</td>
                <td className={`${cell} text-right num`}>{l.qty}</td>
                <td className={cell}>{l.uom}</td>
                <td className={`${cell} text-right num`}>{inr(l.rate)}</td>
                <td className={`${cell} text-right num`}>{l.disc ? inr(l.disc) : "—"}</td>
                <td className={`${cell} text-right num`}>{inr(l.taxableValue)}</td>
                <td className={`${cell} text-right num`}>{l.gstPercent}%</td>
                {inv.taxMode === "intra" ? (
                  <>
                    <td className={`${cell} text-right num`}>{inr(l.cgst)}</td>
                    <td className={`${cell} text-right num`}>{inr(l.sgst)}</td>
                  </>
                ) : (
                  <td className={`${cell} text-right num`}>{inr(l.igst)}</td>
                )}
                <td className={`${cell} text-right num font-semibold`}>
                  {inr(l.taxableValue + l.cgst + l.sgst + l.igst)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-col items-end gap-0.5">
        <div className="flex w-full max-w-[320px] justify-between text-[13px]">
          <span className="text-n600">Taxable total</span><span className="num">{inr(inv.taxableTotal)}</span>
        </div>
        {inv.taxMode === "intra" ? (
          <>
            <div className="flex w-full max-w-[320px] justify-between text-[13px]">
              <span className="text-n600">CGST</span><span className="num">{inr(inv.cgstTotal)}</span>
            </div>
            <div className="flex w-full max-w-[320px] justify-between text-[13px]">
              <span className="text-n600">SGST</span><span className="num">{inr(inv.sgstTotal)}</span>
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-[320px] justify-between text-[13px]">
            <span className="text-n600">IGST</span><span className="num">{inr(inv.igstTotal)}</span>
          </div>
        )}
        <div className="flex w-full max-w-[320px] justify-between text-[13px]">
          <span className="text-n600">Round off</span><span className="num">{inr(inv.roundOff)}</span>
        </div>
        <div className="flex w-full max-w-[320px] justify-between border-t border-ink/20 pt-1 text-sm font-semibold">
          <span>Total</span><span className="num">{inr(inv.grandTotal)}</span>
        </div>
      </div>

      <p className="mt-2 text-[12.5px]">
        <span className="font-mono text-[9px] uppercase tracking-wide text-n600">Amount chargeable (in words) </span>
        {amountInWords(inv.grandTotal)}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr>
              <th className={head}>HSN/SAC</th>
              <th className={`${head} text-right`}>Taxable value</th>
              {inv.taxMode === "intra" ? (
                <>
                  <th className={`${head} text-right`}>Central tax</th>
                  <th className={`${head} text-right`}>State tax</th>
                </>
              ) : (
                <th className={`${head} text-right`}>Integrated tax</th>
              )}
              <th className={`${head} text-right`}>Total tax</th>
            </tr>
          </thead>
          <tbody>
            {[...hsnGroups.entries()].map(([hsn, g]) => (
              <tr key={hsn}>
                <td className={cell}>{hsn}</td>
                <td className={`${cell} text-right num`}>{inr(g.taxable)}</td>
                {inv.taxMode === "intra" ? (
                  <>
                    <td className={`${cell} text-right num`}>{inr(g.cgst)}</td>
                    <td className={`${cell} text-right num`}>{inr(g.sgst)}</td>
                  </>
                ) : (
                  <td className={`${cell} text-right num`}>{inr(g.igst)}</td>
                )}
                <td className={`${cell} text-right num`}>{inr(g.cgst + g.sgst + g.igst)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className={cell}>Total</td>
              <td className={`${cell} text-right num`}>{inr(inv.taxableTotal)}</td>
              {inv.taxMode === "intra" ? (
                <>
                  <td className={`${cell} text-right num`}>{inr(inv.cgstTotal)}</td>
                  <td className={`${cell} text-right num`}>{inr(inv.sgstTotal)}</td>
                </>
              ) : (
                <td className={`${cell} text-right num`}>{inr(inv.igstTotal)}</td>
              )}
              <td className={`${cell} text-right num`}>{inr(totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[12.5px]">
        <span className="font-mono text-[9px] uppercase tracking-wide text-n600">Tax amount (in words) </span>
        {amountInWords(totalTax)}
      </p>

      <div className="mt-5 flex items-end justify-between border-t border-ink/20 pt-3 text-[12.5px]">
        <p className="max-w-[55%] text-n600">
          Declaration: this record shows the price and tax figures as stated
          on the supplier&rsquo;s own invoice {inv.supplierInvoiceNo || "(number pending)"},
          dated {inv.supplierInvoiceDate || "—"}.
        </p>
        <div className="text-right">
          <div>For <b>{inv.buyer.legalName}</b></div>
          <div className="mt-6 font-mono text-[9px] uppercase tracking-wide text-n600">Recorded by Smash Pro Operations</div>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-wide text-n400">
        This is Smash Pro&rsquo;s internal record of a supplier-issued tax invoice —
        not a self-generated e-invoice. GST/HSN figures are transcribed, not
        computed or validated (OBD-11/OBD-20 pending).
      </p>
    </div>
  );
}
