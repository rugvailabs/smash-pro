import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { Dest } from "@/components/supplier-shell";
import { SupplierAckActions } from "@/components/supplier-ack-actions";
import { getPOs } from "@/lib/supplier-api";
import { inr } from "@/lib/format";
import type { ChipTone } from "@/components/buyer-ui";

/* Purchase orders — SUP-009 · Workflow N. PO destination is admin-set:
   warehouse or direct-to-buyer (OBD-19 Option C — suppliers can never
   choose it). */

export const metadata: Metadata = { title: "Purchase orders" };

function tone(f: string): ChipTone {
  if (f === "issued") return "neu";
  if (f === "acknowledged") return "info";
  if (f === "awaiting-proof") return "warn";
  return "ok"; // delivered-proof | closed
}

export default function PosPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <PosContentList />
    </Suspense>
  );
}

async function PosContentList() {
  const pos = await getPOs();

  return (
    <main>
      <PageHead title="Purchase orders" sub="Awarded orders from Smash Pro · terms exactly as quoted" />

      {/* desktop table */}
      <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["PO", "Destination", "Lines", "Issued", "Fulfilment", "Value", ""].map((h, i) => (
                <th key={h || "act"} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i === 5 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pos.map((p) => (
              <tr key={p.id} className="border-b border-n100 last:border-b-0 hover:bg-paper">
                <td className="px-3.5 py-2.5 font-mono text-[12.5px] text-ink">{p.id}</td>
                <td className="px-3.5 py-2.5"><Dest direct={p.destination === "direct"} /></td>
                <td className="num px-3.5 py-2.5">{p.lineQty} × {p.lineName.split(" — ")[0]}</td>
                <td className="px-3.5 py-2.5">{p.issued}</td>
                <td className="px-3.5 py-2.5"><Chip tone={tone(p.fulfilment)}>{p.fulfilmentLabel}</Chip></td>
                <td className="num px-3.5 py-2.5 text-right font-semibold text-ink">{inr(p.value)}</td>
                <td className="px-3.5 py-2.5">
                  {(p.fulfilment as string) === "issued" ? (
                    <SupplierAckActions poId={p.id} size="sm" />
                  ) : (
                    <Link
                      href={p.fulfilment === "awaiting-proof" ? `/supplier/pos/${p.id}/proof` : `/supplier/pos/${p.id}`}
                      className={
                        "inline-flex h-8 items-center rounded-[2px] px-3 text-[13px] font-semibold " +
                        (p.fulfilment === "awaiting-proof"
                          ? "bg-ember-deep text-white hover:bg-ember-press"
                          : "border border-n400 bg-chalk text-ink hover:border-ink")
                      }
                    >
                      {p.fulfilment === "awaiting-proof" ? "Proof" : "Open"}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {pos.map((p) => (
          <Link key={p.id} href={p.fulfilment === "awaiting-proof" ? `/supplier/pos/${p.id}/proof` : `/supplier/pos/${p.id}`}
            className="block rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="font-mono text-[12.5px] text-ink">{p.id}</span>
              <Dest direct={p.destination === "direct"} />
            </div>
            <div className="py-1 text-[13px] text-n600">{p.lineQty} × {p.lineName.split(" — ")[0]} · issued {p.issued}</div>
            <div className="flex items-center justify-between gap-3 py-1">
              <Chip tone={tone(p.fulfilment)}>{p.fulfilmentLabel}</Chip>
              <span className="num text-sm font-semibold text-ink">{inr(p.value)}</span>
            </div>
          </Link>
        ))}
      </div>

      <NoteFlag className="mt-2.5">
        destination is set by smash pro per po (obd-19) · partial shipments
        &amp; dispatch-document requirements pending confirmation · values
        illustrative
      </NoteFlag>
    </main>
  );
}
