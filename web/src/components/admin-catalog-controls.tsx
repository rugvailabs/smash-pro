"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { inr } from "@/lib/format";

/* ============================================================
   Inline catalogue row controls: standard-price edit (PATCH std)
   and active toggle (PATCH active). Small, table-density
   controls — no modals.
   ============================================================ */

export function StdPriceCell({ sku, std }: { sku: string; std: number }) {
  const { busy, error, call, setError } = useAdminCall();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(std));

  const v = parseFloat(value);
  const ok = Number.isFinite(v) && v > 0;

  const save = async () => {
    if (!ok) return;
    if (
      await call(`/api/admin/products/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        body: { std: v },
        done: `${sku} standard price set to ${inr(v)}.`,
      })
    ) {
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <span className="inline-flex items-center justify-end gap-2">
        <span className="num">{inr(std)}</span>
        <button
          onClick={() => { setValue(String(std)); setError(null); setEditing(true); }}
          aria-label={`Edit standard price of ${sku}`}
          className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-ink hover:underline"
        >
          edit
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1.5">
        <input
          type="number"
          min={0.01}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") setEditing(false);
          }}
          aria-label={`Standard price of ${sku}`}
          autoFocus
          className="num h-8 w-28 rounded-[2px] border border-n400 bg-chalk px-2 text-right text-[13px] text-ink"
        />
        <button
          onClick={() => void save()}
          disabled={busy || !ok}
          className="inline-flex h-8 items-center rounded-[2px] border border-n400 bg-chalk px-2 text-[12px] font-semibold text-ink hover:border-ink disabled:text-n400"
        >
          {busy ? "…" : "Save"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={busy}
          className="font-mono text-[10px] uppercase text-n600 hover:text-ink"
        >
          esc
        </button>
      </span>
      <ActionError error={error} className="mt-0 max-w-[220px] text-left" />
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
