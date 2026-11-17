"use client";

import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnGhostSm } from "@/components/admin-ui";

/* Direct-shipment privilege toggle for ACTIVE suppliers (OBD-19:
   governance confirmed, grant criteria ◇ pending — this is a plain
   grant/revoke control, no criteria automation). */

export function DirectToggle({ orgId, approved, name }: { orgId: number; approved: boolean; name: string }) {
  const { busy, error, call } = useAdminCall();

  const flip = () =>
    void call("/api/admin/direct-shipment", {
      body: { orgId, approved: !approved },
      done: approved
        ? `Direct shipment revoked for ${name}.`
        : `Direct shipment approved for ${name}.`,
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2.5">
        <span
          className={
            "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-wide " +
            (approved ? "border-ember-deep text-ember-deep" : "border-n400 text-n600")
          }
        >
          {approved ? "Direct · approved" : "Warehouse only"}
        </span>
        <button onClick={flip} disabled={busy} className={btnGhostSm}>
          {busy ? "Saving…" : approved ? "Revoke" : "Approve direct"}
        </button>
      </div>
      <ActionError error={error} className="mt-1" />
    </div>
  );
}
