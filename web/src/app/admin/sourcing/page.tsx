import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, catLabel, DestTag, statusTone, tdCls, trCls } from "@/components/admin-ui";
import { RequirementForm } from "@/components/admin-requirement-form";
import { getAdminCounts, getRequirementsAdmin } from "@/lib/admin-api";

/* ADM sourcing — admin-managed supplier procurement (first-class
   workflow #2): publish requirements, collect quotations, award, issue
   POs. The queue lists every requirement with its quote count and PO. */

export const metadata: Metadata = { title: "Sourcing" };

export default function SourcingPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SourcingContent />
    </Suspense>
  );
}

async function SourcingContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const reqs = await getRequirementsAdmin();

  return (
    <main>
      <AdminHead
        title="Sourcing"
        sub={<>{reqs.length} requirements · publish → quote → award → purchase order</>}
      />

      <div className="grid items-start gap-7 xl:grid-cols-[8fr_4fr]">
        <div className="min-w-0">
          <Sect>Requirements</Sect>
          {reqs.length === 0 ? (
            <EmptyState message="No requirements published." hint="Publish a requirement to collect supplier quotations." />
          ) : (
            <AdminTable
              minW={900}
              cols={[
                { h: "Requirement" }, { h: "Category" }, { h: "Qty" }, { h: "Destination" },
                { h: "Closes" }, { h: "Status" }, { h: "Quotes", right: true }, { h: "PO" },
              ]}
            >
              {reqs.map((r) => (
                <tr key={r.id} className={trCls}>
                  <td className={tdCls}>
                    <Link href={`/admin/sourcing/${encodeURIComponent(r.id)}`}
                      className="font-medium text-ink hover:underline">
                      {r.title}
                    </Link>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-n400">{r.id}</div>
                  </td>
                  <td className={tdCls}>{catLabel(r.catSlug)}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{r.qty}</td>
                  <td className={tdCls}><DestTag direct={r.destination === "direct"} /></td>
                  <td className={`${tdCls} whitespace-nowrap`}>{r.closes}</td>
                  <td className={tdCls}><Chip tone={statusTone(r.status)}>{r.statusLabel}</Chip></td>
                  <td className={`${tdCls} num text-right`}>{r.quoteCount}</td>
                  <td className={tdCls}>
                    {r.poId ? (
                      <Link href="/admin/pos" className="font-mono text-[12.5px] text-ink hover:underline">
                        {r.poId}
                      </Link>
                    ) : (
                      <span className="text-n400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
          <NoteFlag className="mt-2.5">
            suppliers see only requirements in their approved categories —
            never each other&rsquo;s quotes or identities
          </NoteFlag>
        </div>

        <div className="min-w-0">
          <Sect>Publish</Sect>
          <RequirementForm />
        </div>
      </div>
    </main>
  );
}
