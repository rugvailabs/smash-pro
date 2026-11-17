"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { AdminTable, AuditNote, btnEmberSm, tdCls, trCls } from "@/components/admin-ui";
import type { BuyerTypeDiscountRow } from "@/lib/admin-types";

/* ============================================================
   Buyer Category Discounts — All Products (OBD-05 revised).
   One rate per buyer organisation type, applied uniformly to
   every product across all categories for approved buyers of
   that type. Each of the four buyer categories is always shown;
   admins set / edit the percentage, toggle it active, or remove
   it. Percentages at the surface; the server stores basis points.
   ============================================================ */

function pctLabel(n: number) {
  return `${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

function StatusBadge({ row }: { row: BuyerTypeDiscountRow }) {
  if (!row.configured) {
    return <span className="font-mono text-[10px] uppercase tracking-wide text-n400">not set</span>;
  }
  return row.active ? (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-[2px] bg-ok-t px-2 text-xs font-medium text-ok before:h-1.5 before:w-1.5 before:rounded-full before:bg-current">
      Active
    </span>
  ) : (
    <span className="inline-flex h-6 items-center rounded-[2px] border border-n400 px-2 text-xs font-medium text-n600">
      Inactive
    </span>
  );
}

function BuyerDiscountRow({ row }: { row: BuyerTypeDiscountRow }) {
  const { busy, error, call } = useAdminCall();
  const [pct, setPct] = useState(row.configured ? String(row.discountPct) : "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const n = parseFloat(pct);
  const valid = Number.isFinite(n) && n >= 0 && n <= 90;
  const changed = !row.configured || n !== row.discountPct;

  const save = () =>
    void call("/api/admin/pricing/buyer-type", {
      body: { buyerType: row.buyerType, discountPct: n },
      done: `${row.label} discount set to ${pctLabel(n)} — all products.`,
    });
  const toggle = () =>
    void call("/api/admin/pricing/buyer-type/active", {
      body: { buyerType: row.buyerType, active: !row.active },
      done: `${row.label} discount ${row.active ? "deactivated" : "activated"}.`,
    });
  const remove = () =>
    void call("/api/admin/pricing/buyer-type/remove", {
      body: { buyerType: row.buyerType },
      done: `${row.label} discount removed — standard price applies.`,
    });

  return (
    <tr className={trCls}>
      <td className={`${tdCls} font-semibold text-ink`}>{row.label}</td>

      <td className={tdCls}>
        <span className="inline-flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={90}
            step={0.5}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            aria-label={`${row.label} discount percentage`}
            placeholder="0"
            className="num h-9 w-[82px] rounded-[2px] border border-n400 bg-chalk px-2 text-right text-sm text-ink"
          />
          <span className="text-sm text-n600">%</span>
          <button
            onClick={save}
            disabled={busy || !valid || !changed}
            className={`${btnEmberSm} ml-1.5`}
          >
            {busy ? "…" : row.configured ? "Update" : "Create"}
          </button>
        </span>
        {error && <ActionError error={error} className="mt-1.5 max-w-[260px]" />}
      </td>

      <td className={tdCls}>
        <span className="inline-flex h-6 items-center rounded-[2px] bg-info-t px-2 text-xs font-medium text-info">
          {row.coverage}
        </span>
      </td>

      <td className={tdCls}><StatusBadge row={row} /></td>

      <td className={`${tdCls} text-right`}>
        {row.configured ? (
          <span className="inline-flex items-center justify-end gap-3 whitespace-nowrap">
            <button
              onClick={toggle}
              disabled={busy}
              className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-ink hover:underline disabled:text-n400"
            >
              {row.active ? "deactivate" : "activate"}
            </button>
            {confirmRemove ? (
              <span className="inline-flex items-center gap-2">
                <button
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex h-7 items-center rounded-[2px] border border-bad bg-chalk px-2 text-[12px] font-semibold text-bad hover:bg-bad-t disabled:text-n400"
                >
                  {busy ? "…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  disabled={busy}
                  className="font-mono text-[10px] uppercase text-n600 hover:text-ink"
                >
                  keep
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-bad hover:underline"
              >
                remove
              </button>
            )}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-n400">—</span>
        )}
      </td>
    </tr>
  );
}

export function BuyerDiscountTable({ rows }: { rows: BuyerTypeDiscountRow[] }) {
  return (
    <div>
      <AdminTable
        minW={720}
        cols={[
          { h: "Organisation type" },
          { h: "Discount" },
          { h: "Coverage" },
          { h: "Status" },
          { h: "", right: true },
        ]}
      >
        {rows.map((r) => <BuyerDiscountRow key={r.buyerType} row={r} />)}
      </AdminTable>
      <AuditNote />
    </div>
  );
}
