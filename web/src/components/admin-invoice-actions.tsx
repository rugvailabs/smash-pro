"use client";

import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, btnGhostSm } from "@/components/admin-ui";

export function MarkInvoiceSent({ id }: { id: string }) {
  const { busy, error, call } = useAdminCall();
  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        onClick={() => void call(`/api/admin/invoices/${id}/send`, { done: `${id} marked sent.` })}
        disabled={busy}
        className={btnEmberSm}
      >
        {busy ? "Marking sent…" : "Mark sent"}
      </button>
      <ActionError error={error} className="mt-0" />
    </div>
  );
}

export function DownloadInvoice({ id }: { id: string }) {
  return (
    <a href={`/invoices/${id}/print`} target="_blank" rel="noopener noreferrer" className={btnGhostSm}>
      Download
    </a>
  );
}
