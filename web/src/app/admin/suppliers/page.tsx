import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, ExportCsvLink, tdCls, trCls } from "@/components/admin-ui";
import { getAdminCounts, getSupplierPerformanceAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM supplier performance — read-only analytics per active supplier,
   derived from quotations and purchase orders. Ranked by PO value. No
   commission / settlement figures (OBD-14/21 ◇) — operational metrics only. */

export const metadata: Metadata = { title: "Suppliers" };

export default function AdminSuppliersPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminSuppliersContent />
    </Suspense>
  );
}

function WinRate({ pct, awarded, submitted }: { pct: number; awarded: number; submitted: number }) {
  if (submitted === 0) return <span className="text-n400">—</span>;
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="inline-block h-1.5 w-16 overflow-hidden rounded-[1px] bg-n100" aria-hidden>
        <span className="block h-full bg-ink" style={{ width: `${pct}%` }} />
      </span>
      <span className="num font-semibold text-ink">{pct}%</span>
      <span className="font-mono text-[10px] text-n400">{awarded}/{submitted}</span>
    </span>
  );
}

async function AdminSuppliersContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const rows = await getSupplierPerformanceAdmin();
  const totalValue = rows.reduce((s, r) => s + r.poValueTotal, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <main>
      <AdminHead
        title="Supplier performance"
        titleAside={<Chip tone="neu">{rows.length} active</Chip>}
        sub={<>Quotation win rate, PO issuance &amp; delivery-proof posture, value and outstanding — derived from live records</>}
        actions={<ExportCsvLink kind="supplier-performance" />}
      />

      {rows.length === 0 ? (
        <EmptyState message="No active suppliers yet." hint="Approve a supplier registration to see performance here." />
      ) : (
        <>
          <AdminTable
            minW={1120}
            maxH={640}
            cols={[
              { h: "Supplier" }, { h: "Win rate", right: true }, { h: "Quotes", right: true },
              { h: "POs (closed/flight)", right: true }, { h: "Proofs", right: true },
              { h: "PO value", right: true }, { h: "Outstanding", right: true },
            ]}
          >
            {rows.map((s) => (
              <tr key={s.orgId} className={trCls}>
                <td className={`${tdCls} font-medium text-ink`}>{s.name}</td>
                <td className={`${tdCls} text-right`}>
                  <WinRate pct={s.winRate} awarded={s.quotesAwarded} submitted={s.quotesSubmitted} />
                </td>
                <td className={`${tdCls} num text-right text-[13px] text-n800`}>{s.quotesSubmitted}</td>
                <td className={`${tdCls} num text-right text-[13px] text-n800`}>
                  {s.posIssued}
                  <span className="text-n400"> ({s.posClosed}/{s.posInFlight})</span>
                </td>
                <td className={`${tdCls} num text-right text-[13px] text-n800`}>
                  {s.proofsOnRecord}
                  {s.awaitingProof > 0 && (
                    <span className="ml-1 font-mono text-[10px] uppercase text-warn">{s.awaitingProof} await</span>
                  )}
                </td>
                <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(s.poValueTotal)}</td>
                <td className={`${tdCls} num text-right font-semibold ${s.outstanding > 0 ? "text-warn" : "text-n400"}`}>
                  {inr(s.outstanding)}
                </td>
              </tr>
            ))}
          </AdminTable>
          <div className="mt-2.5 flex flex-wrap justify-end gap-6 text-sm">
            <span className="text-n600">Total PO value <b className="num ml-1 text-ink">{inr(totalValue)}</b></span>
            <span className="text-n600">Total outstanding <b className="num ml-1 text-ink">{inr(totalOutstanding)}</b></span>
          </div>
        </>
      )}
      <NoteFlag className="mt-2.5">
        win rate = awarded ÷ submitted quotations · proofs = direct POs with a
        delivery proof on record · commission / settlement pending obd-14 / obd-21 ◇
      </NoteFlag>
    </main>
  );
}
