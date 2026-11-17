import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AuditNote } from "@/components/admin-ui";
import { ResolveComplaint } from "@/components/admin-complaint-actions";
import { getAdminCounts, getComplaintsAdmin } from "@/lib/admin-api";
import type { AdminComplaintRow } from "@/lib/admin-types";

/* ADM complaints — buyer complaints per order. Open → resolved is the
   only transition (resolution workflow detail pending). Row anatomy
   wraps naturally, so the queue works on phones without a separate
   card variant. */

export const metadata: Metadata = { title: "Complaints" };

export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminComplaintsContent />
    </Suspense>
  );
}

function ComplaintRow({ c }: { c: AdminComplaintRow }) {
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/orders/${encodeURIComponent(c.orderId)}`}
            className="font-mono text-[12.5px] text-ink hover:underline">
            {c.orderId}
          </Link>
          <span className="text-[13px] text-n600">{c.orgName}</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-n400">raised {c.created}</span>
        </div>
        <p className="mt-1 text-sm text-n800">{c.body}</p>
      </div>
      {c.status === "open" ? (
        <ResolveComplaint id={c.id} orderId={c.orderId} />
      ) : (
        <Chip tone="ok">Resolved</Chip>
      )}
    </div>
  );
}

async function AdminComplaintsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const complaints = await getComplaintsAdmin();
  const open = complaints.filter((c) => c.status === "open");
  const resolved = complaints.filter((c) => c.status === "resolved");

  return (
    <main>
      <AdminHead
        title="Complaints"
        titleAside={open.length > 0 ? <Chip tone="warn">{open.length} open</Chip> : undefined}
        sub="Buyer complaints per order — resolve once addressed; the record stays on the order"
      />

      <Sect>Open</Sect>
      {open.length === 0 ? (
        <EmptyState message="No open complaints." hint="New buyer complaints appear here against their order." />
      ) : (
        <Panel>
          {open.map((c) => <ComplaintRow key={c.id} c={c} />)}
        </Panel>
      )}
      <NoteFlag className="mt-2.5">
        resolution workflow detail pending — open / resolved only
      </NoteFlag>
      <AuditNote />

      {resolved.length > 0 && (
        <>
          <Sect>Resolved</Sect>
          <Panel>
            {resolved.map((c) => <ComplaintRow key={c.id} c={c} />)}
          </Panel>
        </>
      )}
    </main>
  );
}
