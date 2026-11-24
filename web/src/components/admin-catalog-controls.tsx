"use client";

import { useState } from "react";
import { useAdminCall } from "@/components/admin-actions";
import { ActionError } from "@/components/admin-actions";

/* ============================================================
   Inline catalogue row controls: just the two quick one-click
   toggles (active / inStock) — single click, no typing, so they
   stay directly actionable from the table. Every other field
   (std price, HSN, GST %, MSP, supplier code, colour, size, image)
   used to have its own per-cell "edit" mini-form here; those were
   removed once the single row-level "Edit" action
   (admin-product-edit.tsx) covered all of them in one consolidated
   form — the table now just displays those values as plain text.
   ============================================================ */

export function InStockToggle({ sku, inStock }: { sku: string; inStock: boolean }) {
  const { busy, error, call } = useAdminCall();

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        onClick={() =>
          void call(`/api/admin/products/${encodeURIComponent(sku)}`, {
            method: "PATCH",
            body: { inStock: !inStock },
            done: inStock ? `${sku} marked out of stock.` : `${sku} marked in stock.`,
          })
        }
        disabled={busy}
        aria-pressed={inStock}
        className={
          "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] px-2 text-xs font-medium disabled:cursor-not-allowed " +
          (inStock ? "bg-ok-t text-ok hover:opacity-80" : "bg-warn-t text-warn hover:opacity-80")
        }
      >
        {busy ? "…" : inStock ? "In stock" : "No stock"}
      </button>
      <ActionError error={error} className="mt-0 max-w-[180px]" />
    </span>
  );
}

export function ActiveToggle({ sku, active }: { sku: string; active: boolean }) {
  const { busy, error, call } = useAdminCall();

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        onClick={() =>
          void call(`/api/admin/products/${encodeURIComponent(sku)}`, {
            method: "PATCH",
            body: { active: !active },
            done: active ? `${sku} deactivated — hidden from the catalogue.` : `${sku} activated.`,
          })
        }
        disabled={busy}
        aria-pressed={active}
        className={
          "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] px-2 text-xs font-medium disabled:cursor-not-allowed " +
          (active ? "bg-ok-t text-ok hover:opacity-80" : "bg-n100 text-n600 hover:text-ink")
        }
      >
        {busy ? "…" : active ? "Active" : "Inactive"}
      </button>
      <ActionError error={error} className="mt-0 max-w-[220px]" />
    </span>
  );
}

/** Read-only row thumbnail (or placeholder swatch) — no inline edit
 *  affordance; the full Edit action (admin-product-edit.tsx) carries the
 *  same images field for changing it. `galleryCount` shows a small "+N"
 *  badge when the product has additional images beyond the main one. */
export function ProductThumbnail({ img, galleryCount = 0 }: { img: string | null; galleryCount?: number }) {
  return (
    <span className="relative inline-block h-8 w-8 shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100 align-middle">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- fixed 32x32 table thumbnail, not worth next/image's overhead here
        <img src={img} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(74deg, transparent, transparent 4px, var(--color-n200) 4px, var(--color-n200) 5px)",
          }}
        />
      )}
      {galleryCount > 0 && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-tl-[2px] bg-ink px-0.5 font-mono text-[8px] font-bold leading-none text-chalk"
        >
          +{galleryCount}
        </span>
      )}
    </span>
  );
}

/** Permanent row delete — two-step inline confirm (same pattern as price
 *  rule removal), since this is a real DELETE, not the Active toggle's
 *  hide-without-removing. The server itself refuses to delete a product
 *  with real order/purchase-order history (surfaced here as the error
 *  message) rather than silently corrupting that record. */
export function ProductDeleteButton({ sku }: { sku: string }) {
  const { busy, error, call } = useAdminCall();
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-bad hover:underline"
      >
        delete
      </button>
    );
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <button
          onClick={() =>
            void call(`/api/admin/products/${encodeURIComponent(sku)}`, { method: "DELETE", done: `${sku} deleted.` })
          }
          disabled={busy}
          className="inline-flex h-7 items-center rounded-[2px] border border-bad bg-chalk px-2 text-[12px] font-semibold text-bad hover:bg-bad-t disabled:text-n400"
        >
          {busy ? "…" : "Confirm"}
        </button>
        <button onClick={() => setConfirm(false)} disabled={busy}
          className="font-mono text-[10px] uppercase text-n600 hover:text-ink">
          keep
        </button>
      </span>
      <ActionError error={error} className="mt-0 max-w-[220px] text-left" />
    </span>
  );
}
