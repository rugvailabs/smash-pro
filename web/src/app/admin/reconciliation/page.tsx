import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, ExportCsvLink, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { VerifyPayment } from "@/components/admin-payment-actions";
import { getAdminCounts, getReconciliationAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM reconciliation — a focused operational view over order payments:
   declared-vs-total (mismatches flagged), verifier and confirmed date, and
   confirmed / awaiting / failed totals. Reuses the existing verify action for
   awaiting items. No gateway, no new money movement (OBD-21). */

export const metadata: Metadata = { title: "Reconciliation" };

export default function AdminReconciliationPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminReconciliationContent />
    </Suspense>
  );
}

function Tile({ label, value, sub, tone }: {
  label: string; value: React.ReactNode; sub?: string; tone?: "warn" | "bad";
}) {
  return (
    <div className="bg-chalk p-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{label}</div>
      <div className={`num mt-1 font-display text-[21px] font-bold ${tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-n600">{sub}</div>}
    </div>
  );
}

async function AdminReconciliationContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { rows, summary } = await getReconciliationAdmin();

  return (
    <main>
      <AdminHead
        title="Payment reconciliation"
        titleAside={summary.mismatchCount > 0 ? <Chip tone="warn">{summary.mismatchCount} mismatch</Chip> : undefined}
        sub="Declared amounts vs order totals, verification status and verifier — one operational view"
        actions={<ExportCsvLink kind="payments" />}
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-n200 bg-n200 sm:grid-cols-4">
        <Tile label="Confirmed" value={inr(summary.confirmedTotal)} sub={`${summary.confirmedCount} order${summary.confirmedCount === 1 ? "" : "s"}`} />
        <Tile label="Awaiting" value={inr(summary.awaitingTotal)} sub={`${summary.awaitingCount} to verify`} tone="warn" />
        <Tile label="Failed / unpaid" value={inr(summary.failedTotal)} sub={`${summary.failedCount} order${summary.failedCount === 1 ? "" : "s"}`} tone="bad" />
        <Tile label="Mismatches" value={summary.mismatchCount} sub="declared ≠ total" tone={summary.mismatchCount > 0 ? "warn" : undefined} />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState message="No orders to reconcile." hint="Orders with payments appear here." />
        ) : (
          <AdminTable
            mobile="hidden"
            minW={1080}
            maxH={640}
            cols={[
              { h: "Order" }, { h: "Buyer" }, { h: "Method" }, { h: "Status" },
              { h: "Order total", right: true }, { h: "Declared", right: true },
              { h: "Verified" }, { h: "" },
            ]}
          >
            {rows.map((p) => (
              <tr key={p.orderId} className={`${trCls} ${p.mismatch ? "bg-warn-t" : ""}`}>
                <td className={tdCls}>
                  <Link href={`/admin/orders/${encodeURIComponent(p.orderId)}`}
                    className="font-mono text-[12.5px] text-ink hover:underline">
                    {p.orderId}
                  </Link>
                </td>
                <td className={tdCls}>{p.orgName}</td>
                <td className={`${tdCls} text-[13px]`}>{p.method || "—"}</td>
                <td className={tdCls}>
                  {p.statusLabel ? <Chip tone={statusTone(p.status)}>{p.statusLabel}</Chip> : <span className="text-n400">—</span>}
                </td>
                <td className={`${tdCls} num text-right`}>{inr(p.orderTotal)}</td>
                <td className={`${tdCls} text-right`}>
                  {p.declaredAmount === null ? (
                    <span className="text-n400">—</span>
                  ) : (
                    <span className={`num ${p.mismatch ? "font-semibold text-warn" : ""}`}>
                      {inr(p.declaredAmount)}
                      {p.mismatch && <span className="ml-1.5 font-mono text-[10px] uppercase">≠ total</span>}
                    </span>
                  )}
                </td>
                <td className={`${tdCls} text-[12px] text-n600`}>
                  {p.status === "confirmed" ? (
                    <>
                      <div className="text-ink">{p.confirmedAt ?? "—"}</div>
                      {p.verifiedBy && <div className="font-mono text-[10px] text-n400">{p.verifiedBy}</div>}
                    </>
                  ) : (
                    <span className="text-n400">—</span>
                  )}
                </td>
                <td className={`${tdCls} text-right`}>
                  {p.status === "awaiting-verification" ? <VerifyPayment orderId={p.orderId} /> : null}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </div>

      <NoteFlag className="mt-2.5">
        no payment gateway (obd-21) — amounts are illustrative and gst-inclusive ·
        a declared amount that differs from the order total is flagged, never hidden ·
        verify is the only money action and it is recorded (plt-003)
      </NoteFlag>
    </main>
  );
}
