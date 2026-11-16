"use client";

import { useState } from "react";
import { Chip, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { inr } from "@/lib/format";
import type { CostProposal, SupplyItem } from "@/lib/types";

/* ============================================================
   Supply catalogue — SUP-004/SUP-012 · Workflow B. Items are
   sourcing information for ProSmash — never shown to buyers.
   Purchase-cost changes are PROPOSALS: effective only on Super
   Admin acceptance, never touching customer selling prices
   (OBD-20). Proposal submission is a prototype interaction.
   ============================================================ */

export function SupplyCatalog({ items, proposals }: { items: SupplyItem[]; proposals: CostProposal[] }) {
  const [proposing, setProposing] = useState<string | null>(null);
  const [newCost, setNewCost] = useState("");
  const [reason, setReason] = useState("");

  return (
    <>
      <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Item", "Category", "Capacity / month", "Lead time", "Current cost to ProSmash", "Cost proposal"].map((h, i) => (
                <th key={h} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i === 4 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.name} className="border-b border-n100 last:border-b-0 align-top hover:bg-paper">
                <td className="min-w-[220px] px-3.5 py-2.5 font-medium text-ink">{it.name}</td>
                <td className="px-3.5 py-2.5">{it.category}</td>
                <td className="num px-3.5 py-2.5">{it.capacity}</td>
                <td className="px-3.5 py-2.5">{it.lead}</td>
                <td className="num px-3.5 py-2.5 text-right">{inr(it.cost)}</td>
                <td className="px-3.5 py-2.5">
                  {it.proposal ? (
                    <Chip tone="warn">{it.proposal}</Chip>
                  ) : proposing === it.name ? (
                    <div className="min-w-[230px]">
                      <input
                        type="number" min={0} step="0.01" value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        placeholder={`New cost (current ${inr(it.cost)})`}
                        aria-label="Proposed cost"
                        className="num mb-1.5 h-9 w-full rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
                      />
                      <input
                        type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for the change" aria-label="Reason"
                        className="mb-1.5 h-9 w-full rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
                      />
                      <div className="flex gap-2">
                        <button className="inline-flex h-8 cursor-not-allowed items-center rounded-[2px] bg-n200 px-3 text-[13px] font-semibold text-n400" aria-disabled>
                          Submit (prototype)
                        </button>
                        <button onClick={() => setProposing(null)} className="text-[13px] font-medium text-n600 hover:text-ink">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setProposing(it.name); setNewCost(""); setReason(""); }}
                      className="text-[13px] font-semibold text-ember-deep hover:underline"
                    >
                      Propose change
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((it) => (
          <div key={it.name} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="text-sm font-medium text-ink">{it.name}</div>
            <div className="py-0.5 text-[13px] text-n600">{it.category} · capacity {it.capacity}/mo · lead {it.lead}</div>
            <div className="flex items-center justify-between gap-3 py-0.5 text-[13px]">
              <span className="text-n600">Cost to ProSmash</span>
              <span className="num font-semibold text-ink">{inr(it.cost)}</span>
            </div>
            {it.proposal && <div className="pt-1.5"><Chip tone="warn">{it.proposal}</Chip></div>}
          </div>
        ))}
      </div>

      <NoteFlag className="mt-2.5">
        all items fall within your approved categories — category subscriptions
        drive requirement matching · costs are supplier-side purchase costs,
        never customer prices · indicative supply pricing policy pending
        (obd-04) · all values illustrative
      </NoteFlag>

      <Sect>Cost-change proposals</Sect>
      <Panel>
        {proposals.map((p) => (
          <div key={p.title} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="num text-sm font-medium text-ink">{p.title}</div>
              <div className="text-[13px] text-n600">{p.detail}</div>
            </div>
            <Chip tone={p.accepted ? "ok" : "warn"}>{p.statusLabel}</Chip>
          </div>
        ))}
      </Panel>
      <NoteFlag className="mt-2.5">
        proposals take effect only on super admin acceptance and never change
        customer-facing selling prices (obd-20) · rejection always carries a
        reason
      </NoteFlag>
    </>
  );
}
