import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, AuditNote, DestTag, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { PoActions } from "@/components/admin-po-actions";
import { getAdminCounts, getPosAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM purchase orders — the procurement ledger (one line per PO), then
   per-PO working panels for everything not yet closed: fulfilment
   advance + payment recording. Records only — commission, settlement
   and payout policy pending OBD-14/21 ◇. */

export const metadata: Metadata = { title: "Purchase orders" };

export default function AdminPosPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminPosContent />
    </Suspense>
  );
}

async function AdminPosContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const pos = await getPosAdmin();
  const working = pos.filter((p) => p.fulfilment !== "closed");

  return (
    <main>
      <AdminHead
        title="Purchase orders"
        sub={<>{pos.length} POs · <span className="num">{working.length}</span> in flight · value, received and outstanding per supplier</>}
      />

      {pos.length === 0 ? (
        <EmptyState message="No purchase orders yet." hint="Award a quotation in Sourcing to issue the first PO." />
      ) : (
        <>
          <AdminTable
            minW={1020}
            cols={[
              { h: "PO" }, { h: "Supplier" }, { h: "Destination" }, { h: "Line" },
              { h: "Issued" }, { h: "Fulfilment" },
              { h: "Value", right: true }, { h: "Received", right: true },
              { h: "Outstanding", right: true }, { h: "Pay status" },
            ]}
          >
            {pos.map((p) => (
              <tr key={p.id} className={trCls}>
                <td className={`${tdCls} font-mono text-[12.5px] text-ink`}>{p.id}</td>
                <td className={tdCls}>{p.supplierName}</td>
                <td className={tdCls}><DestTag direct={p.destination === "direct"} /></td>
                <td className={tdCls}>
                  {p.lineName}
                  <span className="num text-n600"> × {p.lineQty}</span>
                </td>
                <td className={`${tdCls} whitespace-nowrap`}>{p.issued}</td>
                <td className={tdCls}><Chip tone={statusTone(p.fulfilment)}>{p.fulfilmentLabel}</Chip></td>
                <td className={`${tdCls} num text-right`}>{inr(p.value)}</td>
                <td className={`${tdCls} num text-right`}>{inr(p.received)}</td>
                <td className={`${tdCls} num text-right font-semibold ${p.outstanding > 0 ? "text-ink" : "text-n400"}`}>
                  {inr(p.outstanding)}
                </td>
                <td className={`${tdCls} whitespace-nowrap text-[13px] text-n600`}>{p.payStatusLabel}</td>
              </tr>
            ))}
          </AdminTable>

          {working.length > 0 && (
            <>
              <Sect>Working queue</Sect>
              <div className="space-y-4">
                {working.map((p) => (
                  <div key={p.id} className="rounded-[2px] border border-n200 bg-chalk">
                    <div className="flex flex-wrap items-center gap-2.5 border-b border-n200 px-4 py-3">
                      <span className="font-mono text-[12.5px] text-ink">{p.id}</span>
                      <b className="text-sm font-semibold text-ink">{p.supplierName}</b>
                      <DestTag direct={p.destination === "direct"} />
                      <span className="ml-auto"><Chip tone={statusTone(p.fulfilment)}>{p.fulfilmentLabel}</Chip></span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5 sm:grid-cols-3 lg:grid-cols-6">
                      {([
                        ["Line", `${p.lineName} × ${p.lineQty}`, false],
                        ["Unit", inr(p.unit), true],
                        ["PO value", inr(p.value), true],
                        ["Received", inr(p.received), true],
                        ["Outstanding", inr(p.outstanding), true],
                        ["Issued", p.issued, false],
                      ] as [string, string, boolean][]).map(([l, v, num]) => (
                        <div key={l}>
                          <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{l}</div>
                          <div className={`mt-0.5 text-sm font-semibold ${num ? "num" : ""} ${l === "Outstanding" && p.outstanding > 0 ? "text-warn" : "text-ink"}`}>
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-n100 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-n400">
                      pay status · {p.payStatusLabel}
                    </div>
                    <PoActions po={p} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <NoteFlag className="mt-2.5">
        commission, settlement and payout policy pending obd-14 / obd-21 ◇ —
        this view records money movements only, no schedules are implied
      </NoteFlag>
      <AuditNote />
    </main>
  );
}
