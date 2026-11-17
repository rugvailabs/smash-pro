"use client";

import { useState } from "react";
import { Banner } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import type { ReorderResult } from "@/lib/buyer-api";

/* ============================================================
   Reorder (BUY) — re-adds a past order's lines to the server cart
   via /api/orders/[id]/reorder. Inactive / absent SKUs are skipped
   and reported, not failed. On success we surface a durable inline
   summary plus a toast, and offer a full-navigation link to the
   cart so the server cart mirror reloads with the added lines.
   ============================================================ */

const btnSec =
  "inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

export function BuyerReorderButton({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReorderResult | null>(null);

  const reorder = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as (ReorderResult & { error?: string }) | null;
      if (!res.ok || !data || typeof data.added !== "number") {
        toast(data?.error ?? "Couldn't reorder — please try again.");
        return;
      }
      setResult(data);
      if (data.added === 0) {
        toast("Nothing could be re-added — none of these items are currently available.");
      } else {
        const skip = data.skipped.length ? ` · ${data.skipped.length} skipped` : "";
        toast(`Added ${data.added} line${data.added === 1 ? "" : "s"} to your cart${skip}.`);
      }
    } catch {
      toast("Couldn't reorder — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className={btnSec} disabled={busy} onClick={() => void reorder()}>
        {busy ? "Adding to cart…" : "Reorder these items"}
      </button>

      {result && (
        <Banner tone={result.added ? "ok" : "warn"} className="mt-3">
          {result.added > 0 ? (
            <>
              <b className="text-ink">
                {result.added} line{result.added === 1 ? "" : "s"} added to your cart.
              </b>{" "}
              {/* full navigation so the server cart mirror reloads with the new lines */}
              <a href="/cart" className="font-semibold text-ember-deep hover:underline">View cart →</a>
            </>
          ) : (
            <b className="text-ink">None of these items could be re-added.</b>
          )}
          {result.skipped.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-[13px] text-n600">
              {result.skipped.map((s) => (
                <li key={s.sku}>
                  <span className="font-mono text-xs">{s.sku}</span> — {s.reason}
                </li>
              ))}
            </ul>
          )}
        </Banner>
      )}
    </>
  );
}
