import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import {
  AdminHead, AdminTable, AuditNote, ExportCsvLink, KindTag, statusTone, tdCls, trCls,
} from "@/components/admin-ui";
import { OrgActions } from "@/components/admin-org-actions";
import { getAdminCounts, getOrganizationsFullAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM organizations — management of EXISTING buyer & supplier accounts
   (active ↔ suspended). The pending→active/rejected approval flow stays on
   the Approvals surface; suspending here revokes a live account's access
   (session role resolution gates on org status === active). */

export const metadata: Metadata = { title: "Organizations" };

type SP = { kind?: string; status?: string };

const KINDS = ["all", "buyer", "supplier"] as const;
const STATUSES = ["all", "active", "suspended", "pending", "rejected"] as const;

function FilterRow({ label, options, active, build }: {
  label: string; options: readonly string[]; active: string; build: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-14 font-mono text-[10px] uppercase tracking-[.07em] text-n400">{label}</span>
      {options.map((o) => (
        <Link
          key={o}
          href={build(o)}
          className={
            "inline-flex h-7 items-center rounded-[2px] border px-2.5 text-[12px] font-medium capitalize " +
            (active === o ? "border-ink bg-ink text-chalk" : "border-n300 text-n700 hover:border-ink")
          }
        >
          {o}
        </Link>
      ))}
    </div>
  );
}

export default function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminOrganizationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminOrganizationsContent({ searchParams }: { searchParams: Promise<SP> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const sp = await searchParams;
  const kind = (KINDS as readonly string[]).includes(sp.kind ?? "") ? sp.kind! : "all";
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "all";

  const all = await getOrganizationsFullAdmin();
  const rows = all.filter(
    (o) => (kind === "all" || o.kind === kind) && (status === "all" || o.status === status)
  );

  const suspended = all.filter((o) => o.status === "suspended").length;
  const chipFor = (val: string) => (val === "all" ? "" : val);
  const href = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    const k = over.kind ?? kind;
    const s = over.status ?? status;
    if (chipFor(k)) params.set("kind", k);
    if (chipFor(s)) params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin/organizations?${qs}` : "/admin/organizations";
  };

  return (
    <main>
      <AdminHead
        title="Organizations"
        titleAside={suspended > 0 ? <Chip tone="bad">{suspended} suspended</Chip> : undefined}
        sub={<>{all.length} accounts · manage active &amp; suspended organizations · approvals live on the Approvals surface</>}
        actions={<ExportCsvLink kind="organizations" />}
      />

      <div className="mb-5 flex flex-col gap-2">
        <FilterRow label="Kind" options={KINDS} active={kind} build={(v) => href({ kind: v })} />
        <FilterRow label="Status" options={STATUSES} active={status} build={(v) => href({ status: v })} />
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No organizations match this filter." hint="Adjust the kind or status above." />
      ) : (
        <AdminTable
          mobile="hidden"
          minW={1060}
          cols={[
            { h: "Kind" }, { h: "Organization" }, { h: "Type" }, { h: "City" },
            { h: "Status" }, { h: "Orders / POs", right: true }, { h: "Value", right: true }, { h: "" },
          ]}
        >
          {rows.map((o) => (
            <tr key={o.id} className={trCls}>
              <td className={tdCls}><KindTag kind={o.kind} /></td>
              <td className={tdCls}>
                <Link href={`/admin/approvals/${o.id}`} className="font-medium text-ink hover:underline">
                  {o.name}
                </Link>
                <div className="font-mono text-[10px] uppercase tracking-wide text-n400">
                  {o.gstin || "no gstin"}{o.kind === "supplier" && o.directApproved ? " · direct approved" : ""}
                </div>
              </td>
              <td className={`${tdCls} text-[13px] text-n800`}>{o.orgType || "—"}</td>
              <td className={`${tdCls} text-[13px] text-n800`}>{o.city || "—"}</td>
              <td className={tdCls}><Chip tone={statusTone(o.status)}>{o.status}</Chip></td>
              <td className={`${tdCls} num text-right text-[13px] text-n800`}>
                {o.kind === "supplier" ? o.poCount : o.orderCount}
              </td>
              <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(o.totalValue)}</td>
              <td className={`${tdCls} text-right`}><OrgActions orgId={o.id} name={o.name} status={o.status} /></td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* phone fallback */}
      <div className="space-y-3 md:hidden">
        {rows.map((o) => (
          <div key={o.id} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Link href={`/admin/approvals/${o.id}`} className="font-medium text-ink hover:underline">{o.name}</Link>
              <Chip tone={statusTone(o.status)}>{o.status}</Chip>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-n600">
              <KindTag kind={o.kind} /> {o.orgType || "—"} · {o.city || "—"}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[13px]">
              <span className="text-n600">{o.kind === "supplier" ? `${o.poCount} POs` : `${o.orderCount} orders`}</span>
              <span className="num font-semibold text-ink">{inr(o.totalValue)}</span>
            </div>
            <div className="mt-2.5 flex justify-end"><OrgActions orgId={o.id} name={o.name} status={o.status} /></div>
          </div>
        ))}
      </div>

      <NoteFlag className="mt-3">
        suspending an organization revokes its users&rsquo; access immediately
        (session gates on org status) · a reason is required and sent to the org
      </NoteFlag>
      <AuditNote />
    </main>
  );
}
