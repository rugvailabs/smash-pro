"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, NoteFlag, Panel } from "@/components/buyer-ui";
import type { BuyerAddress } from "@/lib/buyer-api";

/* ============================================================
   Delivery-address manager (BUY-009) — REAL CRUD against
   /api/addresses. Add, inline edit, delete (with confirm) and
   set-default, each with its own busy / error state. On success
   we router.refresh() so the server-rendered list (and checkout's
   address picker) reflect the change. Org-scoping is enforced
   server-side; this component only drives it.
   ============================================================ */

const inputCls =
  "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
const btnSec =
  "inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const btnPri =
  "inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
const btnTer = "text-[13px] font-semibold text-ember-deep hover:underline disabled:opacity-60";

async function send(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "content-type": "application/json" }, ...init });
    if (res.ok) return null;
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? "That didn't go through — please try again.";
  } catch {
    return "That didn't go through — check your connection and try again.";
  }
}

export function BuyerAddressManager({ addresses }: { addresses: BuyerAddress[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | "add" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDetail, setEditDetail] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(addresses.length === 0);
  const [addLabel, setAddLabel] = useState("");
  const [addDetail, setAddDetail] = useState("");

  const beginEdit = (a: BuyerAddress) => {
    setError(null);
    setConfirmDeleteId(null);
    setEditingId(a.id);
    setEditLabel(a.label);
    setEditDetail(a.detail);
  };

  const saveEdit = async (id: number) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    const err = await send(`/api/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ label: editLabel, detail: editDetail }),
    });
    setBusy(null);
    if (err) { setError(err); return; }
    setEditingId(null);
    router.refresh();
  };

  const removeAddr = async (id: number) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    const err = await send(`/api/addresses/${id}`, { method: "DELETE" });
    setBusy(null);
    if (err) { setError(err); return; }
    setConfirmDeleteId(null);
    router.refresh();
  };

  const makeDefault = async (id: number) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    const err = await send(`/api/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ setDefault: true }),
    });
    setBusy(null);
    if (err) { setError(err); return; }
    router.refresh();
  };

  const addAddr = async () => {
    if (busy) return;
    setBusy("add");
    setError(null);
    const err = await send(`/api/addresses`, {
      method: "POST",
      body: JSON.stringify({ label: addLabel, detail: addDetail }),
    });
    setBusy(null);
    if (err) { setError(err); return; }
    setAddLabel("");
    setAddDetail("");
    setAddOpen(false);
    router.refresh();
  };

  return (
    <>
      <Panel>
        {addresses.length === 0 && !addOpen && (
          <div className="px-4 py-3.5 text-sm text-n600">No delivery addresses yet.</div>
        )}

        {addresses.map((a) =>
          editingId === a.id ? (
            <div key={a.id} className="border-b border-n100 px-4 py-3.5 last:border-b-0">
              <label className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-n600" htmlFor={`lbl-${a.id}`}>Label</label>
              <input
                id={`lbl-${a.id}`} className={inputCls} value={editLabel}
                maxLength={80} placeholder="e.g. Main campus store"
                onChange={(e) => setEditLabel(e.target.value)}
              />
              <label className="mb-1 mt-3 block text-[11px] font-mono uppercase tracking-wide text-n600" htmlFor={`det-${a.id}`}>Address</label>
              <textarea
                id={`det-${a.id}`} rows={2}
                className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400"
                value={editDetail} maxLength={240} placeholder="Street, area, city, PIN · receiving hours"
                onChange={(e) => setEditDetail(e.target.value)}
              />
              <div className="mt-3 flex gap-2.5">
                <button className={btnPri} disabled={busy === a.id || !editLabel.trim() || !editDetail.trim()} onClick={() => void saveEdit(a.id)}>
                  {busy === a.id ? "Saving…" : "Save changes"}
                </button>
                <button className={btnSec} disabled={busy === a.id} onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={a.id} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  {a.label}
                  {a.isDefault && <span className="ml-2 align-middle"><Chip tone="neu">Default</Chip></span>}
                </div>
                <div className="text-[13px] text-n600">{a.detail}</div>
              </div>
              {confirmDeleteId === a.id ? (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-n600">Delete this address?</span>
                  <button className={btnTer} disabled={busy === a.id} onClick={() => void removeAddr(a.id)}>
                    {busy === a.id ? "Deleting…" : "Confirm"}
                  </button>
                  <button className="text-[13px] font-semibold text-n600 hover:text-ink" disabled={busy === a.id} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3.5">
                  {!a.isDefault && (
                    <button className={btnTer} disabled={busy !== null} onClick={() => void makeDefault(a.id)}>
                      {busy === a.id ? "Setting…" : "Set default"}
                    </button>
                  )}
                  <button className={btnTer} disabled={busy !== null} onClick={() => beginEdit(a)}>Edit</button>
                  <button
                    className="text-[13px] font-semibold text-n600 hover:text-bad"
                    disabled={busy !== null}
                    onClick={() => { setError(null); setEditingId(null); setConfirmDeleteId(a.id); }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {addOpen ? (
          <div className="border-t border-n100 px-4 py-3.5">
            <div className="mb-2.5 text-[11px] font-mono uppercase tracking-wide text-n600">New delivery address</div>
            <label className="sr-only" htmlFor="add-lbl">Label</label>
            <input
              id="add-lbl" className={inputCls} value={addLabel} maxLength={80}
              placeholder="Label — e.g. Main campus store"
              onChange={(e) => setAddLabel(e.target.value)}
            />
            <label className="sr-only" htmlFor="add-det">Address</label>
            <textarea
              id="add-det" rows={2}
              className="mt-2.5 w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400"
              value={addDetail} maxLength={240}
              placeholder="Street, area, city, PIN · receiving hours"
              onChange={(e) => setAddDetail(e.target.value)}
            />
            <div className="mt-3 flex gap-2.5">
              <button className={btnPri} disabled={busy === "add" || !addLabel.trim() || !addDetail.trim()} onClick={() => void addAddr()}>
                {busy === "add" ? "Adding…" : "Add address"}
              </button>
              {addresses.length > 0 && (
                <button className={btnSec} disabled={busy === "add"} onClick={() => { setAddOpen(false); setError(null); }}>Cancel</button>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-n100 px-4 py-3">
            <button className={btnSec} disabled={busy !== null} onClick={() => { setError(null); setConfirmDeleteId(null); setAddOpen(true); }}>
              + Add address
            </button>
          </div>
        )}
      </Panel>

      {error && (
        <p role="alert" className="mt-2 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
      )}
      <NoteFlag className="mt-2">
        the default address is pre-selected at checkout · deleting the default
        promotes another address automatically
      </NoteFlag>
    </>
  );
}
