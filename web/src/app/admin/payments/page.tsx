import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, ExportCsvLink, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { VerifyPayment } from "@/components/admin-payment-actions";
import { getAdminCounts, getPaymentsAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM payments — offline-proof verification queue first (OBD-08: 100%
   advance, admin-verified), then the full payment ledger. A declared
   amount that differs from the order total is flagged, never hidden. */

export const metadata: Metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminPaymentsContent />
    </Suspense>
  );
}

function Declared({ declared, total }: { declared: number | null; total: number }) {
  if (declared === null) return <span className="text-n400">—</span>;
  const mismatch = declared !== total;
  return (
    <span className={`num ${mismatch ? "font-semibold text-warn" : ""}`}>
      {inr(declared)}
      {mismatch && <span className="ml-1.5 font-mono text-[10px] uppercase">≠ total</span>}
    </span>
  );
}

async function AdminPaymentsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const payments = await getPaymentsAdmin();
  const queue = payments.filter((p) => p.status === "awaiting-verification");

  return (
    <main>
      <AdminHead
        title="Payments"
        titleAside={queue.length > 0 ? <Chip tone="warn">{queue.length} to verify</Chip> : undefined}
        sub="Offline payment proofs await admin verification before an order counts as paid (OBD-08)"
        actions={<ExportCsvLink kind="payments" />}
      />

      <Sect>Verification queue</Sect>
      {queue.length === 0 ? (
        <EmptyState message="Nothing to verify." hint="Offline payment declarations land here with their proof records." />
      ) : (
        <>
          <AdminTable
            mobile="hidden"
            minW={960}
            cols={[
              { h: "Order" }, { h: "Buyer" }, { h: "Method" },
              { h: "Order total", right: true }, { h: "Declared", right: true },
              { h: "Proof" }, { h: "" },
            ]}
          >
            {queue.map((p) => (
              <tr key={p.orderId} className={trCls}>
                <td className={tdCls}>
                  <Link href={`/admin/orders/${encodeURIComponent(p.orderId)}`}
                    className="font-mono text-[12.5px] text-ink hover:underline">
                    {p.orderId}
                  </Link>
                </td>
                <td className={tdCls}>{p.orgName}</td>
                <td className={tdCls}>{p.method}</td>
                <td className={`${tdCls} num text-right`}>{inr(p.total)}</td>
                <td className={`${tdCls} text-right`}>
                  <Declared declared={p.declaredAmount} total={p.total} />
                </td>
                <td className={tdCls}>
                  {p.proofFilename ? (
                    <>
                      <span className="font-mono text-[12.5px] text-ink">{p.proofFilename}</span>
                      {p.proofUploadedAt && (
                        <div className="font-mono text-[10px] uppercase tracking-wide text-n400">
                          uploaded {p.proofUploadedAt}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-medium text-warn">no proof file</span>
                  )}
                </td>
                <td className={`${tdCls} text-right`}>
                  <VerifyPayment orderId={p.orderId} />
                </td>
              </tr>
            ))}
          </AdminTable>

          {/* phone fallback — verification is time-sensitive queue work */}
          <div className="space-y-3 md:hidden">
            {queue.map((p) => (
              <div key={p.orderId} className="rounded-[2px] border border-n200 bg-chalk p-4">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Link href={`/admin/orders/${encodeURIComponent(p.orderId)}`}
                    className="font-mono text-[12.5px] text-ink hover:underline">
                    {p.orderId}
                  </Link>
                  <span className="num text-sm font-semibold text-ink">{inr(p.total)}</span>
                </div>
                <div className="text-[13px] text-n600">{p.orgName} · {p.method}</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-n600">Declared</span>
                  <Declared declared={p.declaredAmount} total={p.total} />
                </div>
                {p.proofFilename && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-n400">
                    {p.proofFilename}{p.proofUploadedAt ? ` · ${p.proofUploadedAt}` : ""}
                  </div>
                )}
                <div className="mt-2.5 flex justify-end"><VerifyPayment orderId={p.orderId} /></div>
              </div>
            ))}
          </div>
        </>
      )}
      <NoteFlag className="mt-2.5">
        verification sla + failed-proof policy pending (obd-08 / obd-21 ◇) —
        verify is the only action · every verification is recorded (plt-003)
      </NoteFlag>

      <Sect>All payments</Sect>
      <AdminTable
        minW={820}
        cols={[
          { h: "Order" }, { h: "Buyer" }, { h: "Method" }, { h: "Status" },
          { h: "Order total", right: true }, { h: "Declared", right: true },
        ]}
      >
        {payments.map((p) => (
          <tr key={p.orderId} className={trCls}>
            <td className={tdCls}>
              <Link href={`/admin/orders/${encodeURIComponent(p.orderId)}`}
                className="font-mono text-[12.5px] text-ink hover:underline">
                {p.orderId}
              </Link>
            </td>
            <td className={tdCls}>{p.orgName}</td>
            <td className={tdCls}>{p.method}</td>
            <td className={tdCls}><Chip tone={statusTone(p.status)}>{p.statusLabel}</Chip></td>
            <td className={`${tdCls} num text-right`}>{inr(p.total)}</td>
            <td className={`${tdCls} text-right`}>
              <Declared declared={p.declaredAmount} total={p.total} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
