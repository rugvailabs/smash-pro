import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, KindTag, tdCls, trCls } from "@/components/admin-ui";
import { DirectToggle } from "@/components/admin-direct-toggle";
import { getAdminCounts, getOrganizationsAdmin } from "@/lib/admin-api";

/* ADM approvals — registration review queue (suppliers self-register but
   require Super Admin approval; buyers likewise reviewed). Below the
   queue: direct-shipment governance for ACTIVE suppliers (OBD-19). */

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <ApprovalsContent />
    </Suspense>
  );
}

async function ApprovalsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const [pending, active] = await Promise.all([
    getOrganizationsAdmin("pending"),
    getOrganizationsAdmin("active"),
  ]);
  const activeSuppliers = active.filter((o) => o.kind === "supplier");

  return (
    <main>
      <AdminHead
        title="Approvals"
        titleAside={pending.length > 0 ? <Chip tone="warn">{pending.length} pending</Chip> : undefined}
        sub="Registrations awaiting review — approval activates the account; rejection records a reason"
      />

      {pending.length === 0 ? (
        <EmptyState message="No registrations waiting." hint="New buyer and supplier registrations appear here for review." />
      ) : (
        <>
          <AdminTable
            mobile="hidden"
            minW={860}
            cols={[
              { h: "Kind" }, { h: "Organization" }, { h: "Type" }, { h: "City" },
              { h: "GSTIN" }, { h: "Submitted" }, { h: "Docs", right: true }, { h: "" },
            ]}
          >
            {pending.map((o) => (
              <tr key={o.id} className={trCls}>
                <td className={tdCls}><KindTag kind={o.kind} /></td>
                <td className={tdCls}>
                  <Link href={`/admin/approvals/${o.id}`} className="font-medium text-ink hover:underline">
                    {o.name}
                  </Link>
                  <div className="text-xs text-n600">{o.legalName}</div>
                </td>
                <td className={tdCls}>{o.orgType}</td>
                <td className={tdCls}>{o.city}</td>
                <td className={`${tdCls} font-mono text-[12.5px]`}>{o.gstin}</td>
                <td className={tdCls}>{o.submitted}</td>
                <td className={`${tdCls} num text-right`}>{o.documents.length}</td>
                <td className={`${tdCls} text-right`}>
                  <Link
                    href={`/admin/approvals/${o.id}`}
                    className="inline-flex h-8 items-center rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-semibold text-ink hover:border-ink"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTable>

          {/* phone fallback — approvals genuinely happen on the move */}
          <div className="space-y-3 md:hidden">
            {pending.map((o) => (
              <Link key={o.id} href={`/admin/approvals/${o.id}`}
                className="block rounded-[2px] border border-n200 bg-chalk p-4 hover:border-n400">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{o.name}</span>
                  <KindTag kind={o.kind} />
                </div>
                <div className="text-[13px] text-n600">{o.orgType} · {o.city}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-n400">
                  {o.gstin} · submitted {o.submitted} · {o.documents.length} docs
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      <NoteFlag className="mt-2.5">
        verification checklist pending obd-02 ◇ — review is approve / reject
        only · every decision is recorded (plt-003)
      </NoteFlag>

      <Sect>Direct shipment — active suppliers</Sect>
      <div className="rounded-[2px] border border-n200 bg-chalk">
        {activeSuppliers.length === 0 && (
          <p className="px-4 py-5 text-sm text-n600">No active suppliers yet.</p>
        )}
        {activeSuppliers.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
            <div className="min-w-[200px] flex-1">
              <div className="text-sm font-medium text-ink">{s.name}</div>
              <div className="text-xs text-n600">{s.city} · <span className="font-mono">{s.gstin}</span></div>
            </div>
            <DirectToggle orgId={s.id} approved={s.directApproved} name={s.name} />
          </div>
        ))}
      </div>
      <NoteFlag className="mt-2.5">
        direct shipment is an admin-granted privilege per supplier (obd-19
        decided) · grant criteria ◇ pending — this control records the grant
        only
      </NoteFlag>
    </main>
  );
}
