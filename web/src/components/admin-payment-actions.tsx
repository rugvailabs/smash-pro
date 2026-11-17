"use client";

import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm } from "@/components/admin-ui";

/* Payment verification — the single advancing action of the payments
   queue (OBD-08: offline proofs are admin-verified before an order is
   treated as paid). SLA + failed-proof policy pending ◇ — verify only. */

export function VerifyPayment({ orderId }: { orderId: string }) {
  const { busy, error, call } = useAdminCall();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() =>
          void call("/api/admin/verify-payment", {
            body: { orderId },
            done: `Payment on ${orderId} verified.`,
          })
        }
        disabled={busy}
        className={btnEmberSm}
      >
        {busy ? "Verifying…" : "Verify"}
      </button>
      <ActionError error={error} className="mt-0 max-w-[260px] text-left" />
    </div>
  );
}
