"use client";

import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm } from "@/components/admin-ui";

/* Complaint resolution — open → resolved is the only transition
   (resolution workflow detail pending). */

export function ResolveComplaint({ id, orderId }: { id: number; orderId: string }) {
  const { busy, error, call } = useAdminCall();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() =>
          void call(`/api/admin/complaints/${id}/resolve`, {
            done: `Complaint on ${orderId} marked resolved.`,
          })
        }
        disabled={busy}
        className={btnEmberSm}
      >
        {busy ? "Resolving…" : "Resolve"}
      </button>
      <ActionError error={error} className="mt-0 max-w-[260px] text-left" />
    </div>
  );
}
