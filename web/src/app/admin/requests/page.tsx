import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AuditNote, statusTone } from "@/components/admin-ui";
import { RequestActions } from "@/components/admin-request-actions";
import { getAdminCounts, getProductRequestsAdmin } from "@/lib/admin-api";
import type { AdminProductRequestRow } from "@/lib/admin-types";

/* ADM buyer product requests — Workflow K, admin side: review what
   institutions ask for, mark available once sourced into the catalogue,
   or decline with a reason the buyer sees verbatim. */

export const metadata: Metadata = { title: "Buyer requests" };

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminRequestsContent />
    </Suspense>
  );
}

function RequestRow({ r }: { r: AdminProductRequestRow }) {
  return (
    <div className="border-b border-n100 px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[240px] flex-1">
          <div className="text-sm font-medium text-ink">{r.title}</div>
          <div className="mt-0.5 text-[13px] text-n600">
            <span className="font-mono text-xs">{r.id}</span> · {r.orgName} · {r.category} ·{" "}
            <span className="num">qty {r.qty}</span>
            {r.neededBy && <> · needed by {r.neededBy}</>} · submitted {r.submitted}
          </div>
          {r.status === "declined" && r.declineReason && (
            <div className="mt-1 text-[13px] text-n600">
              <span className="font-mono text-[10px] uppercase tracking-wide text-bad">declined · </span>
              {r.declineReason}
            </div>
          )}
        </div>
        <Chip tone={statusTone(r.status)}>{r.statusLabel}</Chip>
      </div>
      {r.status === "in-review" && (
        <div className="mt-2.5">
          <RequestActions id={r.id} title={r.title} />
        </div>
      )}
    </div>
  );
}

async function AdminRequestsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const requests = await getProductRequestsAdmin();
  const inReview = requests.filter((r) => r.status === "in-review");
  const decided = requests.filter((r) => r.status !== "in-review");

  return (
    <main>
      <AdminHead
        title="Buyer requests"
        titleAside={inReview.length > 0 ? <Chip tone="info">{inReview.length} in review</Chip> : undefined}
        sub="Products institutions asked for that the catalogue doesn't carry — outcomes feed the buyer's own request view"
      />

      <Sect>In review</Sect>
      {inReview.length === 0 ? (
        <EmptyState message="No requests in review." hint="New buyer product requests land here for a sourcing decision." />
      ) : (
        <Panel>{inReview.map((r) => <RequestRow key={r.id} r={r} />)}</Panel>
      )}
      <NoteFlag className="mt-2.5">
        &ldquo;mark available&rdquo; tells the buyer the product is now in the
        catalogue · decline reasons are shown to the buyer verbatim · similar
        institutional demand may be merged for sourcing
      </NoteFlag>
      <AuditNote />

      {decided.length > 0 && (
        <>
          <Sect>Decided</Sect>
          <Panel>{decided.map((r) => <RequestRow key={r.id} r={r} />)}</Panel>
        </>
      )}
    </main>
  );
}
