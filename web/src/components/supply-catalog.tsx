"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";
import type { CostProposal } from "@/lib/types";
import type { SupplierCatalogItem } from "@/lib/supplier-api";

/* ============================================================
   Supply catalogue — SUP-004/SUP-012 · Workflow B, now REAL.
   Items are sourcing information for Smash Pro — never shown to
   buyers. The supplier manages AVAILABILITY; purchase cost is a
   record for the sourcing team (OBD-04/20) and cost changes are
   PROPOSALS, effective only on Super Admin acceptance — they
   never touch customer selling prices.
   ============================================================ */

const CATEGORY_OPTIONS = [
  "Cricket", "Athletics", "Gym & Fitness", "Football", "Basketball", "Volleyball",
  "Badminton", "Tennis", "Indoor Games", "Outdoor Games", "Sportswear", "Accessories",
];

const inputCls = "h-9 w-full rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400";

export function SupplyCatalog({ items, proposals }: { items: SupplierCatalogItem[]; proposals: CostProposal[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [proposing, setProposing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // add-item form
  const [add, setAdd] = useState({ name: "", category: CATEGORY_OPTIONS[0], capacity: "", lead: "", cost: "" });
  // inline-edit form
  const [edit, setEdit] = useState({ name: "", category: CATEGORY_OPTIONS[0], capacity: "", lead: "", cost: "" });
  // cost proposal form
  const [newCost, setNewCost] = useState("");
  const [reason, setReason] = useState("");

  const refresh = () => router.refresh();

  const submitAdd = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/supplier/supply-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: add.name.trim(), category: add.category,
          capacity: add.capacity.trim(), lead: add.lead.trim(),
          cost: parseFloat(add.cost) || 0,
        }),
      });
      if (res.ok) {
        toast(`${add.name.trim()} added to your catalogue.`);
        setAdding(false);
        setAdd({ name: "", category: CATEGORY_OPTIONS[0], capacity: "", lead: "", cost: "" });
        refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not add the item.");
      }
    } catch {
      setError("Could not add the item — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (it: SupplierCatalogItem) => {
    setEditing(it.id);
    setProposing(null);
    setError(null);
    setEdit({ name: it.name, category: it.category, capacity: it.capacity, lead: it.lead, cost: String(it.cost) });
  };

  const submitEdit = async (id: number) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/supplier/supply-items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: edit.name.trim(), category: edit.category,
          capacity: edit.capacity.trim(), lead: edit.lead.trim(),
          cost: parseFloat(edit.cost) || 0,
        }),
      });
      if (res.ok) {
        toast("Item updated.");
        setEditing(null);
        refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not update the item.");
      }
    } catch {
      setError("Could not update the item — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async (it: SupplierCatalogItem) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/supplier/supply-items/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: !it.available }),
      });
      if (res.ok) {
        toast(`${it.name} marked ${!it.available ? "available" : "unavailable"}.`);
        refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not change availability.");
      }
    } catch {
      setError("Could not change availability — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitProposal = async (it: SupplierCatalogItem) => {
    if (busy) return;
    const cost = parseFloat(newCost);
    if (!(cost > 0)) { setError("Enter a proposed cost greater than zero."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/supplier/cost-proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${it.name} — cost change to ${inr(cost)}`,
          detail: reason.trim() || `Proposed new cost ${inr(cost)} (current ${inr(it.cost)}).`,
        }),
      });
      if (res.ok) {
        toast("Cost-change proposal submitted for review.");
        setProposing(null);
        setNewCost(""); setReason("");
        refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not submit the proposal.");
      }
    } catch {
      setError("Could not submit the proposal — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const AvToggle = ({ it }: { it: SupplierCatalogItem }) => (
    <button
      onClick={() => void toggleAvailability(it)}
      disabled={busy}
      aria-pressed={it.available}
      className={
        "inline-flex h-6 items-center gap-1.5 rounded-[2px] px-2 text-xs font-medium disabled:opacity-60 " +
        (it.available ? "bg-ok-t text-ok hover:bg-ok-t/70" : "bg-n100 text-n600 hover:bg-n200")
      }
    >
      <span className={"inline-block h-1.5 w-1.5 rounded-full " + (it.available ? "bg-ok" : "bg-n400")} />
      {it.available ? "Available" : "Unavailable"}
    </button>
  );

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
      )}

      {/* add item */}
      {adding ? (
        <Panel className="mb-4 p-4">
          <div className="mb-3 text-sm font-semibold text-ink">Add a catalogue item</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input className={inputCls} placeholder="Item name" aria-label="Item name" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
            <select className={inputCls} aria-label="Category" value={add.category} onChange={(e) => setAdd({ ...add, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={inputCls} placeholder="Capacity / month" aria-label="Capacity" value={add.capacity} onChange={(e) => setAdd({ ...add, capacity: e.target.value })} />
            <input className={inputCls} placeholder="Lead time" aria-label="Lead time" value={add.lead} onChange={(e) => setAdd({ ...add, lead: e.target.value })} />
            <input className={`${inputCls} num`} type="number" min={0} step="0.01" placeholder="Cost to Smash Pro (₹)" aria-label="Cost" value={add.cost} onChange={(e) => setAdd({ ...add, cost: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={() => void submitAdd()} disabled={busy || !add.name.trim() || !(parseFloat(add.cost) > 0)}
              className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400">
              {busy ? "Adding…" : "Add item"}
            </button>
            <button onClick={() => { setAdding(false); setError(null); }} className="text-sm font-medium text-n600 hover:text-ink">Cancel</button>
          </div>
        </Panel>
      ) : (
        <div className="mb-4">
          <button onClick={() => { setAdding(true); setError(null); }}
            className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press">
            + Add catalogue item
          </button>
        </div>
      )}

      {/* dense supplier table: scrolls inside its own container on narrow
          screens — the page itself never scrolls horizontally */}
      <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr>
              {["Item", "Category", "Capacity / month", "Lead time", "Cost to Smash Pro", "Availability", "Cost proposal"].map((h, i) => (
                <th key={h} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i === 4 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              editing === it.id ? (
                <tr key={it.id} className="border-b border-n100 last:border-b-0 bg-paper align-top">
                  <td className="min-w-[200px] px-3.5 py-2.5"><input className={inputCls} aria-label="Item name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></td>
                  <td className="px-3.5 py-2.5">
                    <select className={inputCls} aria-label="Category" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3.5 py-2.5"><input className={inputCls} aria-label="Capacity" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: e.target.value })} /></td>
                  <td className="px-3.5 py-2.5"><input className={inputCls} aria-label="Lead time" value={edit.lead} onChange={(e) => setEdit({ ...edit, lead: e.target.value })} /></td>
                  <td className="px-3.5 py-2.5"><input className={`${inputCls} num`} type="number" min={0} step="0.01" aria-label="Cost" value={edit.cost} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></td>
                  <td className="px-3.5 py-2.5" colSpan={2}>
                    <div className="flex gap-2">
                      <button onClick={() => void submitEdit(it.id)} disabled={busy || !edit.name.trim() || !(parseFloat(edit.cost) > 0)}
                        className="inline-flex h-8 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400">
                        Save
                      </button>
                      <button onClick={() => { setEditing(null); setError(null); }} className="text-[13px] font-medium text-n600 hover:text-ink">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={it.id} className="border-b border-n100 last:border-b-0 align-top hover:bg-paper">
                  <td className="min-w-[200px] px-3.5 py-2.5">
                    <span className="font-medium text-ink">{it.name}</span>
                    <button onClick={() => startEdit(it)} className="ml-2 text-[12px] font-semibold text-ember-deep hover:underline">Edit</button>
                  </td>
                  <td className="px-3.5 py-2.5">{it.category}</td>
                  <td className="num px-3.5 py-2.5">{it.capacity}</td>
                  <td className="px-3.5 py-2.5">{it.lead}</td>
                  <td className="num px-3.5 py-2.5 text-right">{inr(it.cost)}</td>
                  <td className="px-3.5 py-2.5"><AvToggle it={it} /></td>
                  <td className="px-3.5 py-2.5">
                    {it.proposal ? (
                      <Chip tone="warn">{it.proposal}</Chip>
                    ) : proposing === it.id ? (
                      <div className="min-w-[230px]">
                        <input type="number" min={0} step="0.01" value={newCost} onChange={(e) => setNewCost(e.target.value)}
                          placeholder={`New cost (current ${inr(it.cost)})`} aria-label="Proposed cost"
                          className={`${inputCls} num mb-1.5`} />
                        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason for the change" aria-label="Reason" className={`${inputCls} mb-1.5`} />
                        <div className="flex gap-2">
                          <button onClick={() => void submitProposal(it)} disabled={busy || !(parseFloat(newCost) > 0)}
                            className="inline-flex h-8 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400">
                            {busy ? "Submitting…" : "Submit"}
                          </button>
                          <button onClick={() => setProposing(null)} className="text-[13px] font-medium text-n600 hover:text-ink">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setProposing(it.id); setNewCost(""); setReason(""); setEditing(null); setError(null); }}
                        className="text-[13px] font-semibold text-ember-deep hover:underline">
                        Propose change
                      </button>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((it) => (
          <div key={it.id} className="rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-ink">{it.name}</div>
              <AvToggle it={it} />
            </div>
            <div className="py-0.5 text-[13px] text-n600">{it.category} · capacity {it.capacity}/mo · lead {it.lead}</div>
            <div className="flex items-center justify-between gap-3 py-0.5 text-[13px]">
              <span className="text-n600">Cost to Smash Pro</span>
              <span className="num font-semibold text-ink">{inr(it.cost)}</span>
            </div>
            {it.proposal && <div className="pt-1.5"><Chip tone="warn">{it.proposal}</Chip></div>}
            <div className="mt-2 flex gap-3">
              <button onClick={() => startEdit(it)} className="text-[13px] font-semibold text-ember-deep hover:underline">Edit</button>
              {!it.proposal && (
                <button onClick={() => { setProposing(it.id); setNewCost(""); setReason(""); }} className="text-[13px] font-semibold text-ember-deep hover:underline">Propose cost change</button>
              )}
            </div>
            {editing === it.id && (
              <div className="mt-3 grid gap-2">
                <input className={inputCls} aria-label="Item name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                <select className={inputCls} aria-label="Category" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={inputCls} aria-label="Capacity" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: e.target.value })} />
                <input className={inputCls} aria-label="Lead time" value={edit.lead} onChange={(e) => setEdit({ ...edit, lead: e.target.value })} />
                <input className={`${inputCls} num`} type="number" min={0} step="0.01" aria-label="Cost" value={edit.cost} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={() => void submitEdit(it.id)} disabled={busy || !edit.name.trim() || !(parseFloat(edit.cost) > 0)}
                    className="inline-flex h-9 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400">Save</button>
                  <button onClick={() => setEditing(null)} className="text-[13px] font-medium text-n600 hover:text-ink">Cancel</button>
                </div>
              </div>
            )}
            {proposing === it.id && !it.proposal && (
              <div className="mt-3 grid gap-2">
                <input type="number" min={0} step="0.01" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder={`New cost (current ${inr(it.cost)})`} aria-label="Proposed cost" className={`${inputCls} num`} />
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the change" aria-label="Reason" className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={() => void submitProposal(it)} disabled={busy || !(parseFloat(newCost) > 0)}
                    className="inline-flex h-9 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400">Submit</button>
                  <button onClick={() => setProposing(null)} className="text-[13px] font-medium text-n600 hover:text-ink">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <NoteFlag className="mt-2.5">
        availability is supplier-managed · all items fall within your approved
        categories — category subscriptions drive requirement matching · costs
        are supplier-side purchase costs, never customer prices · indicative
        supply pricing policy pending (obd-04) · all values illustrative
      </NoteFlag>

      <Sect>Cost-change proposals</Sect>
      <Panel>
        {proposals.length ? proposals.map((p) => (
          <div key={p.title} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="num text-sm font-medium text-ink">{p.title}</div>
              <div className="text-[13px] text-n600">{p.detail}</div>
            </div>
            <Chip tone={p.accepted ? "ok" : "warn"}>{p.statusLabel}</Chip>
          </div>
        )) : (
          <div className="px-4 py-3.5 text-[13px] text-n600">No cost-change proposals yet.</div>
        )}
      </Panel>
      <NoteFlag className="mt-2.5">
        proposals take effect only on super admin acceptance and never change
        customer-facing selling prices (obd-20) · rejection always carries a
        reason
      </NoteFlag>
    </>
  );
}
