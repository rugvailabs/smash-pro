import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AuditNote } from "@/components/admin-ui";
import { ServiceRequestActions } from "@/components/admin-service-request-actions";
import { getAdminCounts, getServiceRequestsAdmin } from "@/lib/admin-api";
import { serviceLabel } from "@/lib/service-catalog";
import { inr } from "@/lib/format";
import type { AdminServiceRequestRow } from "@/lib/admin-types";
import type { ChipTone as BuyerChipTone } from "@/components/buyer-ui";

/* ADM service requests (ADR-0020) — equipment Care/Repair bookings,
   submitted publicly (no account required). Admin inspects the
   photos/voice note, enters a manual quote, and moves status forward.
   No pricing engine or payment flow is involved — this is a triage
   queue, same density pattern as Complaints. */

export const metadata: Metadata = { title: "Service Requests" };

const STATUS_TONE: Record<AdminServiceRequestRow["status"], BuyerChipTone> = {
  new: "warn", quoted: "info", approved: "info", "in-progress": "info",
  completed: "ok", declined: "bad", cancelled: "neu",
};

export default function AdminServiceRequestsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminServiceRequestsContent />
    </Suspense>
  );
}

function RequestCard({ r }: { r: AdminServiceRequestRow }) {
  return (
    <div className="border-b border-n100 p-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] text-ink">{r.id}</span>
            <Chip tone={STATUS_TONE[r.status]}>{r.statusLabel}</Chip>
            <Chip tone="neu">{r.kind === "care" ? "Care" : "Repair"}</Chip>
            <span className="text-[13px] capitalize text-n600">{r.sport}</span>
          </div>
          <div className="mt-1 text-sm text-n800">
            <b className="font-medium text-ink">{r.contactName}</b> · {r.contactPhone}
            {r.contactEmail && <> · {r.contactEmail}</>}
            {r.orgName && <> · <span className="text-n600">{r.orgName}</span></>}
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-n400">submitted {r.submitted}</span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-n400">Services</dt>
          <dd className="text-n800">{r.services.map((s) => serviceLabel(r.sport, r.kind, s)).join(", ")}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-n400">Equipment</dt>
          <dd className="text-n800">
            {r.equipmentSource === "new" ? "New — purchased from Smash Pro" : "Customer-owned equipment"}
            {(r.brand || r.model) && <> — {[r.brand, r.model].filter(Boolean).join(" ")}</>}
          </dd>
        </div>
        {r.description && (
          <div className="sm:col-span-2">
            <dt className="font-mono text-[10px] uppercase tracking-wide text-n400">Description</dt>
            <dd className="text-n800">{r.description}</dd>
          </div>
        )}
        {r.quoted !== null && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-n400">Quoted</dt>
            <dd className="num font-semibold text-ink">{inr(r.quoted)}</dd>
          </div>
        )}
      </dl>

      {(r.photos.length > 0 || r.voiceNoteUrl) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {r.photos.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 overflow-hidden rounded-[2px] border border-n200">
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size thumbnail from an admin-uploaded set, not worth next/image here */}
              <img src={url} alt={`${r.id} photo ${i + 1}`} className="h-full w-full object-cover" />
            </a>
          ))}
          {r.voiceNoteUrl && (
            <audio controls src={r.voiceNoteUrl} className="h-9 max-w-[260px]" />
          )}
        </div>
      )}

      <div className="mt-3.5 border-t border-n100 pt-3.5">
        <ServiceRequestActions request={r} />
      </div>
    </div>
  );
}

async function AdminServiceRequestsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const requests = await getServiceRequestsAdmin();
  const active = requests.filter((r) => !["completed", "declined", "cancelled"].includes(r.status));
  const closed = requests.filter((r) => ["completed", "declined", "cancelled"].includes(r.status));

  return (
    <main>
      <AdminHead
        title="Service Requests"
        titleAside={counts.serviceRequestsNew > 0 ? <Chip tone="warn">{counts.serviceRequestsNew} new</Chip> : undefined}
        sub="Equipment Care &amp; Repair bookings submitted from the public site — inspect photos/voice note, quote manually"
      />

      <Sect>Active</Sect>
      {active.length === 0 ? (
        <EmptyState message="No active service requests." hint="New Care/Repair bookings from the public Service page appear here." />
      ) : (
        <Panel>{active.map((r) => <RequestCard key={r.id} r={r} />)}</Panel>
      )}
      <NoteFlag className="mt-2.5">
        pricing is admin-entered after inspection — no payment flow wired to this yet (pending confirmation)
      </NoteFlag>
      <AuditNote />

      {closed.length > 0 && (
        <>
          <Sect>Completed / closed</Sect>
          <Panel>{closed.map((r) => <RequestCard key={r.id} r={r} />)}</Panel>
        </>
      )}
    </main>
  );
}
