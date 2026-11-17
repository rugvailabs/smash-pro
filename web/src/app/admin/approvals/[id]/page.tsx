import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Chip, DocRow, KV, NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, catLabel, KindTag, statusTone } from "@/components/admin-ui";
import { ApprovalActions } from "@/components/admin-approval-actions";
import { getAdminCounts, getOrganizationAdmin } from "@/lib/admin-api";

/* ADM approval review — full organization record: business details,
   submitted documents (metadata-only, ADR-0005), and for suppliers the
   requested-category review grid. Approve/Reject are the only actions
   (checklist pending OBD-02 ◇). */

export const metadata: Metadata = { title: "Approval review" };

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <ApprovalDetailContent params={params} />
    </Suspense>
  );
}

async function ApprovalDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { id } = await params;
  const orgId = Number(id);
  const org = Number.isFinite(orgId) ? await getOrganizationAdmin(orgId) : null;
  if (!org) notFound();

  return (
    <main>
      <AdminHead
        crumb={<><Link href="/admin/approvals" className="hover:underline">Approvals</Link> / <b className="text-ink">{org.name}</b></>}
        title={org.name}
        titleAside={
          <span className="inline-flex items-center gap-2">
            <KindTag kind={org.kind} />
            <Chip tone={statusTone(org.status)}>{org.status}</Chip>
          </span>
        }
        sub={<>{org.orgType} · {org.city} · submitted {org.submitted}</>}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[6fr_6fr]">
        <div className="min-w-0">
          <Sect>Business details</Sect>
          <Panel className="px-4 py-2">
            <KV k="Trading name">{org.name}</KV>
            <KV k="Legal name">{org.legalName}</KV>
            <KV k="Organization type">{org.orgType}</KV>
            <KV k="GSTIN"><span className="font-mono text-[12.5px]">{org.gstin}</span></KV>
            <KV k="City">{org.city}</KV>
            <KV k="Contact">{org.contactName}</KV>
            <KV k="Phone"><span className="num">{org.contactPhone}</span></KV>
            <KV k="Email">{org.email}</KV>
            {org.kind === "supplier" && (
              <KV k="Requested categories">
                {org.requestedCategories && org.requestedCategories.length > 0
                  ? org.requestedCategories.map(catLabel).join(", ")
                  : "—"}
              </KV>
            )}
          </Panel>
          <NoteFlag className="mt-2.5">
            gstin format-checked only — business verification requirements
            pending confirmation (obd-02) and professional validation
          </NoteFlag>

          <Sect>Submitted documents</Sect>
          <Panel>
            {org.documents.length === 0 && (
              <p className="px-4 py-5 text-sm text-n600">No documents submitted.</p>
            )}
            {org.documents.map((d) => (
              <DocRow
                key={d.filename}
                file={d.filename}
                meta={d.state}
                action={<Chip tone={statusTone(d.state)}>{d.state}</Chip>}
              />
            ))}
          </Panel>
          <NoteFlag className="mt-2.5">
            document records are metadata-only in this build (adr-0005) — file
            storage lands with the platform backend decision
          </NoteFlag>
        </div>

        <div className="min-w-0">
          <Sect>Review</Sect>
          {org.status === "pending" ? (
            <ApprovalActions org={org} />
          ) : (
            <Panel>
              <PanelHead title="Decision" aside={<Chip tone={statusTone(org.status)}>{org.status}</Chip>} />
              <p className="px-4 py-4 text-sm text-n600">
                This registration has already been processed — its decision and
                operator are on the audit record (PLT-003). No further action
                is available here.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </main>
  );
}
