import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import {
  AdminHead, AdminTable, btnGhostSm, ExportCsvLink, inputCls, labelCls, tdCls, trCls,
} from "@/components/admin-ui";
import { getAdminCounts, getAuditLogAdmin } from "@/lib/admin-api";

/* ADM audit log — the append-only record of every operator action
   (PLT-003). Read-only: this surface never edits or deletes a row. Filter
   by entity type and an entity-id substring; paginate with "load more". */

export const metadata: Metadata = { title: "Audit log" };

const PAGE = 100;

type SP = { entity?: string; q?: string; limit?: string };

export default function AdminAuditPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminAuditContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminAuditContent({ searchParams }: { searchParams: Promise<SP> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const sp = await searchParams;
  const entity = sp.entity?.trim() || "";
  const q = sp.q?.trim() || "";
  const limit = Math.min(Math.max(Number(sp.limit) || PAGE, PAGE), 1000);

  const page = await getAuditLogAdmin({
    entity: entity || undefined,
    entityId: q || undefined,
    limit,
    offset: 0,
  });

  const shown = page.rows.length;
  const hasMore = page.total > shown;
  const qs = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    const e = over.entity ?? entity;
    const query = over.q ?? q;
    const l = over.limit ?? String(limit);
    if (e) params.set("entity", e);
    if (query) params.set("q", query);
    if (l && l !== String(PAGE)) params.set("limit", l);
    const s = params.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  };

  return (
    <main>
      <AdminHead
        title="Audit log"
        titleAside={<Chip tone="neu">{page.total} records</Chip>}
        sub="Every operator action, newest first — append-only (PLT-003)"
        actions={<ExportCsvLink kind="audit-log" />}
      />

      {/* server-rendered GET filter — no client JS needed */}
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls} htmlFor="entity">Entity type</label>
          <select id="entity" name="entity" defaultValue={entity}
            className="h-10 w-52 rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink">
            <option value="">All entities</option>
            {page.entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className={labelCls} htmlFor="q">Entity ID contains</label>
          <input id="q" name="q" defaultValue={q} placeholder="e.g. ORD-2026 · PO-2026 · 12"
            className={inputCls} />
        </div>
        <button type="submit" className={btnGhostSm}>Apply</button>
        {(entity || q) && (
          <Link href="/admin/audit" className="font-mono text-[10px] uppercase tracking-wide text-n600 hover:text-ink">
            clear
          </Link>
        )}
      </form>

      {page.rows.length === 0 ? (
        <EmptyState message="No audit records match." hint="Operator actions are recorded here as they happen." />
      ) : (
        <>
          <AdminTable
            minW={1040}
            maxH={640}
            cols={[
              { h: "When" }, { h: "Actor" }, { h: "Action" },
              { h: "Entity" }, { h: "Entity ID" }, { h: "Detail" },
            ]}
          >
            {page.rows.map((a) => (
              <tr key={a.id} className={trCls}>
                <td className={`${tdCls} whitespace-nowrap font-mono text-[11.5px] text-n600`}>{a.at}</td>
                <td className={tdCls}>
                  {a.actorEmail ? (
                    <>
                      <span className="text-[13px] text-ink">{a.actorEmail}</span>
                      {a.actorRole && (
                        <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wide text-n400">{a.actorRole}</span>
                      )}
                    </>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-n400">system</span>
                  )}
                </td>
                <td className={`${tdCls} font-mono text-[12px] text-ink`}>{a.action}</td>
                <td className={`${tdCls} text-[13px] text-n800`}>{a.entity}</td>
                <td className={`${tdCls} font-mono text-[12px] text-n800`}>{a.entityId}</td>
                <td className={`${tdCls} max-w-[360px] text-[12.5px] text-n600`}>
                  {a.detail ?? <span className="text-n400">—</span>}
                </td>
              </tr>
            ))}
          </AdminTable>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wide text-n400">
              showing {shown} of {page.total}
            </span>
            {hasMore && (
              <Link href={qs({ limit: String(limit + PAGE) })} className={btnGhostSm}>
                Load more
              </Link>
            )}
          </div>
        </>
      )}
      <NoteFlag className="mt-3">
        the audit log is append-only — this surface is read-only and never
        edits or deletes a record (plt-003)
      </NoteFlag>
    </main>
  );
}
