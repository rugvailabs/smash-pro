import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { getAdminCounts, getInvoicesAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* Supplier invoices recorded against purchase-order awards — a
   transcription of the paper/PDF invoice the supplier already issued,
   kept in the structure of a standard GST tax invoice. Record-keeping
   only (see server/admin.ts invoice section) — not a tax engine. */

export const metadata: Metadata = { title: "Invoices" };

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminInvoicesContent />
    </Suspense>
  );
}

async function AdminInvoicesContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const invoices = await getInvoicesAdmin();

  return (
    <main>
      <AdminHead
        title="Invoices"
        sub={<>{invoices.length} supplier invoices recorded · generate one from a purchase order once goods are received</>}
      />

      {invoices.length === 0 ? (
        <EmptyState
          message="No invoices recorded yet."
          hint="Open a purchase order in the Purchase orders list and choose Generate to record the supplier's invoice."
        />
      ) : (
        <AdminTable
          minW={1100}
          cols={[
            { h: "Invoice" }, { h: "Requirement" }, { h: "Supplier" }, { h: "Supplier's invoice no." },
            { h: "Supplier's date" }, { h: "Status" }, { h: "Total", right: true },
          ]}
        >
          {invoices.map((inv) => (
            <tr key={inv.id} className={trCls}>
              <td className={tdCls}>
                <Link href={`/admin/invoices/${inv.id}`} className="font-mono text-[12.5px] text-ink hover:underline">
                  {inv.id}
                </Link>
              </td>
              <td className={tdCls}>
                <Link href={`/admin/sourcing/${inv.reqId}`} className="text-ink hover:underline">{inv.reqTitle}</Link>
                <div className="font-mono text-[10px] uppercase tracking-wide text-n400">{inv.reqId}</div>
              </td>
              <td className={tdCls}>{inv.supplierName}</td>
              <td className={`${tdCls} font-mono text-[12.5px]`}>{inv.supplierInvoiceNo}</td>
              <td className={`${tdCls} whitespace-nowrap`}>{inv.supplierInvoiceDate}</td>
              <td className={tdCls}><Chip tone={statusTone(inv.status)}>{inv.status === "sent" ? "Sent" : "Draft"}</Chip></td>
              <td className={`${tdCls} num text-right font-semibold`}>{inr(inv.grandTotal)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
      <NoteFlag className="mt-2.5">
        every GST/HSN figure here is transcribed from the supplier&rsquo;s own
        invoice for record-keeping — not computed or validated by smash pro
        (obd-11 / obd-20 professional tax validation still pending, same as
        every other gst-adjacent field in this app)
      </NoteFlag>
    </main>
  );
}
