"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, btnGhostSm } from "@/components/admin-ui";

/* ============================================================
   Buyer product-request outcomes (Workflow K, admin side):
   in-review → available or declined (reason required — the
   reason is shown verbatim in the buyer's own request view).
   ============================================================ */

export function RequestActions({ id, title }: { id: string; title: string }) {
  const { busy, error, call } = useAdminCall();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");

  const markAvailable = () =>
    void call(`/api/admin/product-requests/${encodeURIComponent(id)}/status`, {
      body: { status: "available" },
      done: `${id} marked available — the buyer sees it in their request view.`,
    });

  const decline = async () => {
    if (!reason.trim()) return;
    if (
      await call(`/api/admin/product-requests/${encodeURIComponent(id)}/status`, {
        body: { status: "declined", declineReason: reason.trim() },
        done: `${id} declined — reason recorded for the buyer.`,
      })
    ) {
      setDeclineOpen(false);
      setReason("");
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={markAvailable} disabled={busy} className={btnEmberSm}>
          {busy && !declineOpen ? "Working…" : "Mark available"}
        </button>
        <button
          onClick={() => setDeclineOpen((v) => !v)}
          disabled={busy}
          className={btnGhostSm}
          aria-expanded={declineOpen}
        >
          Decline…
        </button>
      </div>
      {declineOpen && (
        <div className="mt-2.5 rounded-[2px] border border-n200 bg-paper p-3">
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor={`dec-${id}`}>
            Decline reason (required — shown to the buyer on &ldquo;{title}&rdquo;)
          </label>
          <input
            id={`dec-${id}`}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. No supplier meets the stated specification at this quantity"
            className="h-9 w-full rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
          />
          <button onClick={() => void decline()} disabled={busy || !reason.trim()} className={`${btnGhostSm} mt-2`}>
            {busy ? "Declining…" : "Confirm decline"}
          </button>
        </div>
      )}
      <ActionError error={error} />
    </div>
  );
}
