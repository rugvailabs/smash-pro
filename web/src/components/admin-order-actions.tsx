"use client";

import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmber } from "@/components/admin-ui";

/* Order rail advance — rendered ONLY when the server says a next legal
   status exists (AdminOrderDetail.nextStatus non-null). The one Ember
   action on the order detail view. */

export function OrderAdvance({ orderId, next }: { orderId: string; next: { status: string; label: string } }) {
  const { busy, error, call } = useAdminCall();

  return (
    <div>
      <button
        onClick={() =>
          void call(`/api/admin/orders/${encodeURIComponent(orderId)}/advance`, {
            done: `${orderId} advanced to ${next.label}.`,
          })
        }
        disabled={busy}
        className={`${btnEmber} w-full`}
      >
        {busy ? "Advancing…" : `Advance to ${next.label}`}
      </button>
      <ActionError error={error} />
    </div>
  );
}
