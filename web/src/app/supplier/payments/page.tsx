import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, DocRow, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getPaymentRecords, getPOs } from "@/lib/supplier-api";
import { inr } from "@/lib/format";

/* Supplier payments — SUP-010 · Workflow N: per-PO invoiced / received /
   outstanding, terms as quoted. NO payout schedules, settlement cycles,
   commissions or credit terms are shown or implied — those policies are
   pending (OBD-14 / OBD-21 ◇ / allowed-terms). Figures mirror ProSmash
   records (ADM-017). */

export const metadata: Metadata = { title: "Supplier payments" };

export default function SupplierPaymentsPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SupplierPaymentsContent />
    </Suspense>
  );
}

async function SupplierPaymentsContent() {
  const [pos, records] = await Promise.all([getPOs(), getPaymentRecords()]);
  const active = pos.filter((p) => p.fulfilment !== "closed");
  const invoiced = active.reduce((s, p) => s + p.value, 0);
  const received = active.reduce((s, p) => s + p.received, 0);
  const outstanding = active.reduce((s, p) => s + p.outstanding, 0);

  return (
    <main>
      <PageHead
        title="Payments"
        sub={<>Your complete money trail with ProSmash — per purchase order
          <NoteFlag className="mt-1">amounts illustrative · figures mirror prosmash records</NoteFlag></>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Invoiced to ProSmash", inr(invoiced), `${active.length} active/recent POs`, false],
          ["Received", inr(received), "recorded by ProSmash", false],
          ["Outstanding", inr(outstanding), "1 PO with balance due", true],
        ].map(([l, v, c, warn]) => (
          <div key={l as string} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{l}</div>
            <div className="num mt-1 font-display text-[21px] font-bold text-ink">{v}</div>
            <div className={`mt-0.5 text-xs ${warn ? "font-medium text-warn" : "text-n600"}`}>{c}</div>
          </div>
        ))}
      </div>

      <Sect>Per purchase order</Sect>
      {/* dense supplier table: scrolls inside its own container on narrow
          screens — the page itself never scrolls horizontally */}
      <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr>
              {["PO", "Terms (as quoted)", "PO value", "Received", "Outstanding", "Status"].map((h, i) => (
                <th key={h} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i >= 2 && i <= 4 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((p) => (
              <tr key={p.id} className="border-b border-n100 last:border-b-0 hover:bg-paper">
                <td className="px-3.5 py-2.5 font-mono text-[12.5px] text-ink">{p.id}</td>
                <td className="px-3.5 py-2.5">{p.paymentTerms}</td>
                <td className="num px-3.5 py-2.5 text-right">{inr(p.value)}</td>
                <td className="num px-3.5 py-2.5 text-right">{inr(p.received)}</td>
                <td className="num px-3.5 py-2.5 text-right font-semibold text-ink">{inr(p.outstanding)}</td>
                <td className="px-3.5 py-2.5">
                  <Chip tone={p.outstanding === 0 ? "ok" : p.payStatusLabel === "Balance on delivery" ? "warn" : "neu"}>
                    {p.payStatusLabel}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {active.map((p) => (
          <div key={p.id} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="font-mono text-[12.5px] text-ink">{p.id}</span>
              <Chip tone={p.outstanding === 0 ? "ok" : p.payStatusLabel === "Balance on delivery" ? "warn" : "neu"}>{p.payStatusLabel}</Chip>
            </div>
            <div className="py-0.5 text-[13px] text-n600">{p.paymentTerms}</div>
            <div className="flex items-center justify-between gap-3 py-0.5 text-[13px]">
              <span className="text-n600">Outstanding</span>
              <span className="num font-semibold text-ink">{inr(p.outstanding)}</span>
            </div>
          </div>
        ))}
      </div>
      <NoteFlag className="mt-2.5">
        payment terms originate from your awarded quotation on each po ·
        allowed-terms policy, payout mechanics and any platform fee model are
        pending owner decisions (obd-14 / obd-21 ◇) — no settlement schedule is
        implied by this view
      </NoteFlag>

      <Sect>Recent payment records</Sect>
      <Panel>
        {records.map((r) => (
          <DocRow key={r.title} file={r.title} meta={r.meta} action={<Chip tone="ok">Recorded</Chip>} />
        ))}
      </Panel>
    </main>
  );
}
