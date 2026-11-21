import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import {
  AdminHead, AdminTable, AuditNote, btnGhostSm, DestTag, labelCls, statusTone, tdCls, trCls,
} from "@/components/admin-ui";
import { PoActions } from "@/components/admin-po-actions";
import { getAdminCounts, getBrandsAdmin, getPosAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM purchase orders — the procurement ledger (one line per PO), then
   per-PO working panels for everything not yet closed: fulfilment
   advance + payment recording. Records only — commission, settlement
   and payout policy pending OBD-14/21 ◇. */

export const metadata: Metadata = { title: "Purchase orders" };

type SP = { brand?: string };

export default function AdminPosPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminPosContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminPosContent({ searchParams }: { searchParams: Promise<SP> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const sp = await searchParams;
  const brandFilter = sp.brand?.trim() || "";

  const [allPos, brands] = await Promise.all([getPosAdmin(), getBrandsAdmin()]);
  const pos = brandFilter ? allPos.filter((p) => p.brand === brandFilter) : allPos;
  const working = pos.filter((p) => p.fulfilment !== "closed");

  return (
    <main>
      <AdminHead
        title="Purchase orders"
        sub={<>{pos.length} POs{brandFilter && <> · brand <b className="text-ink">{brandFilter}</b></>} · <span className="num">{working.length}</span> in flight · value, received and outstanding per supplier</>}
      />

      {/* server-rendered GET filter — no client JS needed */}
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls} htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brandFilter}
            className="h-10 w-52 rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink">
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={btnGhostSm}>Apply</button>
        {brandFilter && (
          <Link href="/admin/pos" className="font-mono text-[10px] uppercase tracking-wide text-n600 hover:text-ink">
            clear
          </Link>
        )}
      </form>

      {pos.length === 0 ? (
        <EmptyState
          message={brandFilter ? "No purchase orders for this brand." : "No purchase orders yet."}
          hint={brandFilter ? "Try another brand, or clear the filter." : "Award a quotation in Sourcing to issue the first PO."}
        />
      ) : (
        <>
          <AdminTable
            minW={1440}
            cols={[
              { h: "PO" }, { h: "Supplier" }, { h: "Destination" }, { h: "Item" }, { h: "Brand" }, { h: "Qty", right: true },
              { h: "Price/unit", right: true }, { h: "MRP", right: true }, { h: "Disc. vs MRP", right: true },
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
                <td className={tdCls}>{p.lineName}</td>
                <td className={tdCls}>{p.brand ?? <span className="text-n400">—</span>}</td>
                <td className={`${tdCls} num text-right`}>{p.lineQty}</td>
                <td className={`${tdCls} num text-right`}>{inr(p.unit)}</td>
                <td className={`${tdCls} num text-right ${p.mrp === null ? "text-n400" : "text-n600 line-through"}`}>
                  {p.mrp !== null ? inr(p.mrp) : "—"}
                </td>
                <td className={`${tdCls} num text-right`}>
                  {p.discountVsMrpPct !== null ? `${p.discountVsMrpPct}%` : <span className="text-n400">—</span>}
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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5 sm:grid-cols-3 lg:grid-cols-9">
                      {([
                        ["Item", p.lineName, false],
                        ["Brand", p.brand ?? "—", false],
                        ["Qty", String(p.lineQty), true],
                        ["Price/unit", inr(p.unit), true],
                        ["MRP", p.mrp !== null ? inr(p.mrp) : "—", true],
                        ["Disc. vs MRP", p.discountVsMrpPct !== null ? `${p.discountVsMrpPct}%` : "—", true],
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
        this view records money movements only, no schedules are implied ·
        brand/mrp resolve automatically from the catalogue product linked at
        po issue — nobody enters them per purchase · "disc. vs mrp" compares
        this po's unit price to the linked product's mrp, it is not a
        supplier-negotiated discount (no such field exists) · unit-of-measure
        (pcs/set/pair) and gst rate/itc eligibility are deliberately absent —
        no uom field exists in the catalogue yet, and gst/tax entry remains
        pending obd-20 / obd-11 + professional tax validation, same as every
        other gst-adjacent field in this app
      </NoteFlag>
      <AuditNote />
    </main>
  );
}
