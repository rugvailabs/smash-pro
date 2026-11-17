import { Suspense } from "react";
import type { Metadata } from "next";
import { Banner, Chip, KV, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getSupplierReport } from "@/lib/supplier-api";
import { inr } from "@/lib/format";

/* Supplier reporting — PLT-001: aggregated from THIS supplier's own rows
   only; never references other suppliers or buyers. Commission / settlement
   remain OBD-14/21 — payments are records only, not reported here. */

export const metadata: Metadata = { title: "Reporting" };

export default function SupplierReportPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SupplierReportContent />
    </Suspense>
  );
}

function Bar({ value, max, label, count }: { value: number; max: number; label: string; count: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-2">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-n800">{label}</span>
        <span className="num font-mono text-[12px] text-n600">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-[2px] bg-n100">
        <div className="h-full rounded-[2px] bg-ember-deep" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

async function SupplierReportContent() {
  const report = await getSupplierReport();

  if (!report) {
    return (
      <main>
        <PageHead title="Reporting" sub="Your own performance — matched, quoted, awarded and fulfilled" />
        <Panel className="px-4 py-6 text-sm text-n600">No reporting data is available yet.</Panel>
      </main>
    );
  }

  const { quotations: q, pos, money, requirementsMatched } = report;
  const poMax = Math.max(1, ...pos.byState.map((s) => s.count));
  const receivedPct = money.poValue > 0 ? Math.round((money.received / money.poValue) * 100) : 0;

  const tiles = [
    { l: "Requirements matched", v: String(requirementsMatched), c: "to your approved categories" },
    { l: "Quotations submitted", v: String(q.total), c: `${q.awarded} awarded · ${q.notSelected} not selected` },
    { l: "Win rate", v: `${q.winRatePct}%`, c: "of decided quotations" },
    { l: "Outstanding receivable", v: inr(money.outstanding), c: `across ${pos.count} PO${pos.count === 1 ? "" : "s"}`, num: true },
  ];

  return (
    <main>
      <PageHead
        title="Reporting"
        sub={<>Your own performance — matched, quoted, awarded and fulfilled
          <NoteFlag className="mt-1">derived from your rows only — never other suppliers or buyers (plt-001)</NoteFlag></>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{t.l}</div>
            <div className={`num mt-1 font-display font-bold text-ink ${t.num ? "text-[19px]" : "text-[27px]"}`}>{t.v}</div>
            <div className="mt-0.5 text-xs text-n600">{t.c}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-7 lg:grid-cols-2">
        <div>
          <Sect>Purchase orders by fulfilment state</Sect>
          <Panel className="px-4 py-3">
            {pos.byState.map((s) => (
              <Bar key={s.state} label={s.label} value={s.count} max={poMax} count={String(s.count)} />
            ))}
            <div className="mt-2 flex items-baseline justify-between border-t border-n100 pt-2.5 text-sm">
              <span className="text-n600">Total PO value</span>
              <span className="num font-semibold text-ink">{inr(pos.totalValue)}</span>
            </div>
          </Panel>
          <NoteFlag className="mt-2">counts are your purchase orders across their lifecycle states</NoteFlag>
        </div>

        <div>
          <Sect>Quotation outcomes</Sect>
          <Panel className="px-4 py-3">
            {[
              { label: "Awarded", count: q.awarded },
              { label: "Not selected", count: q.notSelected },
              { label: "Withdrawn", count: q.withdrawn },
              { label: "In review / open", count: Math.max(0, q.total - q.awarded - q.notSelected - q.withdrawn) },
            ].map((row) => (
              <Bar key={row.label} label={row.label} value={row.count} max={Math.max(1, q.total)} count={String(row.count)} />
            ))}
          </Panel>

          <Sect>Money — received vs outstanding</Sect>
          <Panel className="px-4 py-3">
            <KV k="PO value"><span className="num">{inr(money.poValue)}</span></KV>
            <KV k="Received"><span className="num">{inr(money.received)}</span></KV>
            <KV k="Outstanding"><b className="num">{inr(money.outstanding)}</b></KV>
            <KV k="Payment records"><span className="num">{money.paymentRecords}</span></KV>
            <div className="mt-2 pt-1">
              <div className="mb-1 flex items-baseline justify-between text-[12px] text-n600">
                <span>Collected</span><span className="num">{receivedPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-[2px] bg-n100">
                <div className="h-full rounded-[2px] bg-ok" style={{ width: `${receivedPct}%` }} />
              </div>
            </div>
          </Panel>
          <NoteFlag className="mt-2">
            payments are records only — commission &amp; settlement schedules
            pending (obd-14/21)
          </NoteFlag>
        </div>
      </div>

      <Sect>At a glance</Sect>
      <Panel className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="info">{q.total} quotations</Chip>
          <Chip tone="ok">{q.awarded} awarded</Chip>
          <Chip tone="neu">{pos.count} purchase orders</Chip>
          <Chip tone={money.outstanding > 0 ? "warn" : "ok"}>{inr(money.outstanding)} outstanding</Chip>
        </div>
      </Panel>

      <Banner tone="info" className="mt-6">
        <b className="text-ink">This is your data only.</b> Reporting aggregates
        your own requirements, quotations, purchase orders and payments —
        competing suppliers and buyer identities are never part of it.
      </Banner>
    </main>
  );
}
