import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, DestTag, ExportCsvLink, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { getAdminCounts, getOrdersAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM orders — every buyer order on the platform, dense ledger view.
   Rail advances happen on the detail page; cancellation windows are
   pending OBD-17, so no cancel action exists anywhere. */

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

async function AdminOrdersContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const orders = await getOrdersAdmin();

  return (
    <main>
      <AdminHead
        title="Orders"
        sub={<>{orders.length} orders · buyer commerce ledger — advance, payment and complaints per order</>}
        actions={<ExportCsvLink kind="orders" />}
      />

      {orders.length === 0 ? (
        <EmptyState message="No orders yet." hint="Buyer orders appear here the moment they are placed." />
      ) : (
        <>
          <AdminTable
            mobile="hidden"
            minW={980}
            maxH={640}
            cols={[
              { h: "Order" }, { h: "Buyer" }, { h: "Placed" }, { h: "Status" },
              { h: "Payment" }, { h: "Destination" }, { h: "Lines", right: true }, { h: "Total", right: true },
            ]}
          >
            {orders.map((o) => (
              <tr key={o.id} className={trCls}>
                <td className={tdCls}>
                  <Link href={`/admin/orders/${encodeURIComponent(o.id)}`}
                    className="font-mono text-[12.5px] text-ink hover:underline">
                    {o.id}
                  </Link>
                </td>
                <td className={tdCls}>{o.orgName}</td>
                <td className={`${tdCls} whitespace-nowrap`}>{o.placed}</td>
                <td className={tdCls}><Chip tone={statusTone(o.status)}>{o.statusLabel}</Chip></td>
                <td className={tdCls}><Chip tone={statusTone(o.paymentStatus)}>{o.paymentStatusLabel}</Chip></td>
                <td className={tdCls}><DestTag direct={o.direct} /></td>
                <td className={`${tdCls} num text-right`}>{o.lineCount}</td>
                <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(o.total)}</td>
              </tr>
            ))}
          </AdminTable>

          <div className="space-y-3 md:hidden">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${encodeURIComponent(o.id)}`}
                className="block rounded-[2px] border border-n200 bg-chalk p-4 hover:border-n400">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[12.5px] text-ink">{o.id}</span>
                  <Chip tone={statusTone(o.status)}>{o.statusLabel}</Chip>
                </div>
                <div className="text-[13px] text-n600">{o.orgName} · {o.placed}</div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <Chip tone={statusTone(o.paymentStatus)}>{o.paymentStatusLabel}</Chip>
                  <span className="num text-sm font-semibold text-ink">{inr(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      <NoteFlag className="mt-2.5">
        cancellation windows pending obd-17 — no cancel actions exist · 100%
        advance payment confirmed (obd-08)
      </NoteFlag>
    </main>
  );
}
