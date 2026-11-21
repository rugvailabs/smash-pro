"use client";

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
 *  same ImagePathField for changing it. */
export function ProductThumbnail({ img }: { img: string | null }) {
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
    </span>
  );
}
