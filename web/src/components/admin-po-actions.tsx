"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, btnGhostSm } from "@/components/admin-ui";
import { inr } from "@/lib/format";
import type { AdminPoRow } from "@/lib/admin-types";

/* ============================================================
   PO working controls: fulfilment advance (only when the server
   says a next legal step exists) + payment recording against the
   outstanding balance. Records only — commission / settlement /
   payout scheduling pending OBD-14/21 ◇.
   ============================================================ */

export function PoActions({ po }: { po: AdminPoRow }) {
  const { busy, error, call } = useAdminCall();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");

  const amt = parseFloat(amount);
  const amountOk = Number.isFinite(amt) && amt > 0 && amt <= po.outstanding;

  const advance = () =>
    void call(`/api/admin/pos/${encodeURIComponent(po.id)}/advance`, {
      done: `${po.id} advanced to ${po.nextFulfilment?.label ?? "next stage"}.`,
    });

  const record = async () => {
    if (!amountOk) return;
    if (
      await call(`/api/admin/pos/${encodeURIComponent(po.id)}/record-payment`, {
        body: { amount: amt, title: title.trim() || undefined },
        done: `${inr(amt)} recorded against ${po.id}.`,
      })
    ) {
      setAmount("");
      setTitle("");
      setOpen(false);
    }
  };

  return (
    <div className="border-t border-n100 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {po.nextFulfilment && (
          <button onClick={advance} disabled={busy} className={btnEmberSm}>
            {busy ? "Working…" : `Advance to ${po.nextFulfilment.label}`}
          </button>
        )}
        {po.outstanding > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            disabled={busy}
            className={btnGhostSm}
            aria-expanded={open}
          >
            Record payment…
          </button>
        )}
        {!po.nextFulfilment && po.outstanding === 0 && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-n400">
            nothing to action — fulfilment and payment complete
          </span>
        )}
      </div>

      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-[2px] border border-n200 bg-paper p-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor={`amt-${po.id}`}>
              Amount (≤ <span className="num">{inr(po.outstanding)}</span> outstanding)
            </label>
            <input
              id={`amt-${po.id}`}
              type="number"
              min={0.01}
              step="0.01"
              max={po.outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="num h-9 w-44 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor={`ttl-${po.id}`}>
              Record title (optional)
            </label>
            <input
              id={`ttl-${po.id}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Balance on delivery"
              className="h-9 w-full rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
            />
          </div>
          <button onClick={() => void record()} disabled={busy || !amountOk} className={btnGhostSm}>
            {busy ? "Recording…" : "Record"}
          </button>
          {amount !== "" && !amountOk && (
            <p className="w-full text-xs font-medium text-warn">
              Amount must be above zero and within the outstanding balance.
            </p>
          )}
        </div>
      )}

      <ActionError error={error} />
    </div>
  );
}
