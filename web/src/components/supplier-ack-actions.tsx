"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";

/* ============================================================
   PO acknowledgement (shared lifecycle): issued → acknowledged.
   Real endpoint — the supplier accepts the purchase order before
   any dispatch is possible.
   ============================================================ */

export function SupplierAckActions({
  poId, size = "lg",
}: { poId: string; size?: "sm" | "lg" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acknowledge = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/pos/${poId}/acknowledge`, { method: "POST" });
      if (res.ok) {
        toast(`${poId} acknowledged.`);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not acknowledge — please try again.");
      }
    } catch {
      setError("Could not acknowledge — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const cls =
    size === "lg"
      ? "inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
      : "inline-flex h-8 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={() => void acknowledge()} disabled={busy} className={cls}>
        {busy ? "Acknowledging…" : "Acknowledge"}
      </button>
      {error && <span role="alert" className="text-[11px] text-bad">{error}</span>}
    </span>
  );
}
