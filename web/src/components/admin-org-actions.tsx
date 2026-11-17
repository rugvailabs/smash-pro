"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, btnGhostSm } from "@/components/admin-ui";

/* ============================================================
   Organization management controls — suspend an ACTIVE org (a
   reason is required; the org's users lose access immediately
   because session role resolution gates on org status active)
   and reactivate a SUSPENDED org. Approvals (pending → active /
   rejected) stay in the approvals surface — untouched here.
   ============================================================ */

export function OrgActions({
  orgId, name, status,
}: {
  orgId: number;
  name: string;
  status: "pending" | "active" | "suspended" | "rejected";
}) {
  const { busy, error, call, setError } = useAdminCall();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const reasonOk = reason.trim().length > 0 && reason.trim().length <= 1000;

  const suspend = async () => {
    if (!reasonOk) return;
    if (
      await call(`/api/admin/organizations/${orgId}/suspend`, {
        body: { reason: reason.trim() },
        done: `${name} suspended — access revoked.`,
      })
    ) {
      setReason("");
      setOpen(false);
    }
  };

  const reactivate = () =>
    void call(`/api/admin/organizations/${orgId}/reactivate`, {
      done: `${name} reactivated.`,
    });

  if (status === "active") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {!open ? (
          <button
            onClick={() => { setError(null); setOpen(true); }}
            disabled={busy}
            className={btnGhostSm}
          >
            Suspend…
          </button>
        ) : (
          <div className="w-[260px] rounded-[2px] border border-n200 bg-paper p-2.5">
            <label className="mb-1.5 block text-[12px] font-medium text-ink" htmlFor={`susp-${orgId}`}>
              Reason (recorded &amp; sent to the org)
            </label>
            <textarea
              id={`susp-${orgId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="e.g. Pending re-verification of GSTIN"
              className="w-full rounded-[2px] border border-n400 bg-chalk px-2 py-1.5 text-[13px] text-ink placeholder:text-n400"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => { setOpen(false); setReason(""); setError(null); }}
                disabled={busy}
                className="font-mono text-[10px] uppercase text-n600 hover:text-ink"
              >
                cancel
              </button>
              <button onClick={() => void suspend()} disabled={busy || !reasonOk} className={btnEmberSm}>
                {busy ? "Suspending…" : "Confirm suspend"}
              </button>
            </div>
          </div>
        )}
        <ActionError error={error} className="mt-0 max-w-[260px] text-left" />
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button onClick={reactivate} disabled={busy} className={btnEmberSm}>
          {busy ? "Reactivating…" : "Reactivate"}
        </button>
        <ActionError error={error} className="mt-0 max-w-[260px] text-left" />
      </div>
    );
  }

  // pending / rejected are handled in the approvals surface
  return <span className="font-mono text-[10px] uppercase tracking-wide text-n400">—</span>;
}
