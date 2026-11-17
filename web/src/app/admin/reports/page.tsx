import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { getAdminCounts, getAdminReport } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM reports — read-only operational summary. Plain figures and CSS
   bars, no chart library: every number is labelled and exact
   (PORTAL-PRINCIPLES §5 — density from discipline, not widgets). */

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminReportsContent />
    </Suspense>
  );
}

function Fig({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{label}</div>
      <div className="num mt-1 font-display text-[21px] font-bold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-n600">{sub}</div>}
    </div>
  );
}

async function AdminReportsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const r = await getAdminReport();
  if (!r) return <AdminGate />;
  const maxCat = Math.max(...r.topCategories.map((c) => c.value), 1);

  return (
    <main>
      <AdminHead
        title="Reports"
        sub={<>Operational summary — read-only
          <NoteFlag className="mt-1">illustrative demo data — figures &amp; amounts are sample values</NoteFlag></>}
      />

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Panel>
          <PanelHead title="Orders" />
          <div className="grid grid-cols-2 gap-4 px-4 py-4">
            <Fig label="Orders placed" value={r.orders.count} />
            <Fig label="Order value" value={inr(r.orders.valueTotal)} sub="incl. GST" />
          </div>
          <div className="border-t border-n100 px-4 py-3">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-n400">By status</div>
            {r.orders.byStatus.map(([label, n]) => (
              <div key={label} className="flex items-baseline justify-between py-1 text-sm">
                <span className="text-n800">{label}</span>
                <span className="num font-semibold text-ink">{n}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Payments" />
          <div className="grid grid-cols-2 gap-4 px-4 py-4">
            <Fig label="Confirmed" value={inr(r.payments.confirmedTotal)} sub="verified buyer payments" />
            <Fig
              label="Awaiting verification"
              value={inr(r.payments.awaitingTotal)}
              sub={`${r.payments.awaitingCount} payment${r.payments.awaitingCount === 1 ? "" : "s"} in queue`}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Procurement" />
          <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-3">
            <Fig label="PO value" value={inr(r.procurement.poValueTotal)} sub="issued to suppliers" />
            <Fig label="Outstanding" value={inr(r.procurement.outstandingToSuppliers)} sub="owed to suppliers" />
            <Fig label="Open POs" value={r.procurement.posOpen} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Organizations" />
          <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-3">
            <Fig label="Active buyers" value={r.orgs.buyersActive} />
            <Fig label="Active suppliers" value={r.orgs.suppliersActive} />
            <Fig label="Pending review" value={r.orgs.pending} />
          </div>
        </Panel>
      </div>

      <Sect>Top categories by order value</Sect>
      <Panel className="px-4 py-4">
        {r.topCategories.map((c) => {
          const w = Math.max(2, Math.round((c.value / maxCat) * 100));
          return (
            <div key={c.slug} className="flex items-center gap-3 py-1.5">
              <span className="w-32 shrink-0 text-sm text-n800 sm:w-40">{c.name}</span>
              <span className="h-4 flex-1 rounded-[1px] bg-n100">
                <span
                  className="block h-full rounded-[1px] bg-ink"
                  style={{ width: `${w}%` }}
                  aria-hidden
                />
              </span>
              <span className="num w-28 shrink-0 text-right text-sm font-semibold text-ink">
                {inr(c.value)}
              </span>
            </div>
          );
        })}
      </Panel>
      <NoteFlag className="mt-2.5">
        order value incl. gst · procurement figures mirror po records —
        commission / settlement reporting pending obd-14 / obd-21 ◇
      </NoteFlag>
    </main>
  );
}
