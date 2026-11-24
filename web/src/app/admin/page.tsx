import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import {
  getAdminCounts, getComplaintsAdmin, getOrganizationsAdmin, getPaymentsAdmin, getServiceRequestsAdmin,
} from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM dashboard — "what needs the operations team today". A count strip
   over every queue, then the concrete items. Zero decoration: the density
   IS the design (PORTAL-PRINCIPLES §5). */

export const metadata: Metadata = { title: "Operations" };

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const [pendingOrgs, payments, complaints, serviceRequests] = await Promise.all([
    getOrganizationsAdmin("pending"),
    getPaymentsAdmin(),
    getComplaintsAdmin(),
    getServiceRequestsAdmin(),
  ]);
  const toVerify = payments.filter((p) => p.status === "awaiting-verification");
  const openComplaints = complaints.filter((c) => c.status === "open");
  const newServiceRequests = serviceRequests.filter((s) => s.status === "new");

  const stats: { label: string; value: number; href: string }[] = [
    { label: "Pending approvals", value: counts.pendingOrgs, href: "/admin/approvals" },
    { label: "Payments to verify", value: counts.paymentsToVerify, href: "/admin/payments" },
    { label: "Open complaints", value: counts.openComplaints, href: "/admin/complaints" },
    { label: "Open requirements", value: counts.requirementsOpen, href: "/admin/sourcing" },
    { label: "Quotes awaiting action", value: counts.quotesAwaitingAction, href: "/admin/sourcing" },
    { label: "POs in flight", value: counts.posInFlight, href: "/admin/pos" },
    { label: "Product requests", value: counts.productRequestsInReview, href: "/admin/requests" },
    { label: "New service requests", value: counts.serviceRequestsNew, href: "/admin/service-requests" },
  ];

  type QueueItem = { tag: string; text: React.ReactNode; meta: string; href: string; key: string };
  const queue: QueueItem[] = [
    ...pendingOrgs.slice(0, 4).map((o) => ({
      key: `org-${o.id}`,
      tag: "approval",
      text: <><b className="font-medium text-ink">{o.name}</b> — {o.kind} registration awaiting review</>,
      meta: `submitted ${o.submitted} · ${o.city}`,
      href: `/admin/approvals/${o.id}`,
    })),
    ...toVerify.slice(0, 4).map((p) => ({
      key: `pay-${p.orderId}`,
      tag: "payment",
      text: (
        <>
          <b className="font-medium text-ink">{p.orgName}</b> declared{" "}
          <span className="num">{inr(p.declaredAmount ?? p.total)}</span> on{" "}
          <span className="font-mono text-[12.5px]">{p.orderId}</span>
        </>
      ),
      meta: p.method + (p.proofFilename ? " · proof attached" : " · no proof file"),
      href: "/admin/payments",
    })),
    ...openComplaints.slice(0, 3).map((c) => ({
      key: `cmp-${c.id}`,
      tag: "complaint",
      text: (
        <>
          <b className="font-medium text-ink">{c.orgName}</b> on{" "}
          <span className="font-mono text-[12.5px]">{c.orderId}</span>:{" "}
          {c.body.length > 90 ? c.body.slice(0, 90) + "…" : c.body}
        </>
      ),
      meta: `raised ${c.created}`,
      href: "/admin/complaints",
    })),
    ...newServiceRequests.slice(0, 3).map((sr) => ({
      key: `svc-${sr.id}`,
      tag: "service",
      text: (
        <>
          <b className="font-medium text-ink">{sr.contactName}</b> — {sr.kind === "care" ? "Care" : "Repair"} ·{" "}
          {sr.sport} · {sr.services.length} service{sr.services.length === 1 ? "" : "s"}
        </>
      ),
      meta: `submitted ${sr.submitted} · ${sr.photos.length} photo${sr.photos.length === 1 ? "" : "s"}${sr.voiceNoteUrl ? " · voice note" : ""}`,
      href: "/admin/service-requests",
    })),
  ];

  return (
    <main>
      <AdminHead
        title="Operations"
        sub={<>Approvals, sourcing, orders and money — everything that needs the team, in one pass
          <NoteFlag className="mt-1">illustrative preview data — figures &amp; amounts are sample values</NoteFlag></>}
      />

      {/* count strip — hairline-divided cells, each a jump into its queue */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-n200 bg-n200 sm:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="block bg-chalk p-3.5 transition-colors hover:bg-paper">
            <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{s.label}</div>
            <div className={`num mt-1 font-display text-[26px] font-bold ${s.value > 0 ? "text-ink" : "text-n400"}`}>
              {s.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Panel>
          <PanelHead
            title="Action queue"
            aside={<span className="font-mono text-[11px] text-n600">{queue.length} items</span>}
          />
          {queue.length === 0 && (
            <p className="px-4 py-6 text-sm text-n600">Queue clear — nothing needs the team right now.</p>
          )}
          {queue.map((q) => (
            <div key={q.key} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
              <span className="w-[76px] shrink-0 font-mono text-[10px] uppercase tracking-[.07em] text-n600">
                {q.tag}
              </span>
              <div className="min-w-[240px] flex-1">
                <div className="text-sm text-n800">{q.text}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-n400">{q.meta}</div>
              </div>
              <Link
                href={q.href}
                className="ml-auto inline-flex h-8 shrink-0 items-center rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-semibold text-ink hover:border-ink"
              >
                Review
              </Link>
            </div>
          ))}
        </Panel>
        <NoteFlag className="mt-2.5">
          every action is recorded — audit log plt-003
        </NoteFlag>
      </div>
    </main>
  );
}
