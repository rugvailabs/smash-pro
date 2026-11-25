"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip, NoteFlag, type ChipTone } from "@/components/buyer-ui";
import { inr } from "@/lib/format";
import type { Order } from "@/lib/types";

/* Orders list — desktop hairline table + mobile key-value cards with
   working client-side filters. Cancellation windows pending (P-08/OBD-17)
   — no cancel actions shown. */

const STATUS_TONE: Record<string, ChipTone> = {
  placed: "info", processing: "info", dispatched: "info",
  delivered: "ok", "confirm-receipt": "warn", cancelled: "bad",
};
const PAY_TONE: Record<string, ChipTone> = {
  confirmed: "ok", "awaiting-verification": "warn", failed: "bad", "cancelled-unpaid": "bad",
};

const STATUS_FILTERS = [
  ["all", "Status: All"], ["placed", "Placed"], ["processing", "Processing"],
  ["confirm-receipt", "Confirm receipt"], ["delivered", "Delivered"], ["cancelled", "Cancelled"],
] as const;
const PAY_FILTERS = [
  ["all", "Payment: All"], ["confirmed", "Confirmed"],
  ["awaiting-verification", "Awaiting verification"], ["cancelled-unpaid", "Cancelled — unpaid"],
] as const;

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [status, setStatus] = useState("all");
  const [pay, setPay] = useState("all");
  const [q, setQ] = useState("");

  const shown = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "all" || o.status === status) &&
          (pay === "all" || o.payment.status === pay) &&
          (!q.trim() || o.id.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [orders, status, pay, q]
  );

  const sel = "h-9 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Payment" className={sel} value={pay} onChange={(e) => setPay(e.target.value)}>
          {PAY_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          type="text" placeholder="Order ID" aria-label="Order ID" value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 w-[160px] rounded-[2px] border border-n400 bg-chalk px-2.5 font-mono text-xs text-ink placeholder:text-n400"
        />
        <span className="num ml-auto font-mono text-xs text-n600">
          {shown.length} {shown.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {/* desktop table */}
      <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Order", "Placed", "Lines", "Payment", "Status", "Amount", ""].map((h, i) => (
                <th key={h || "act"} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i === 5 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} className="border-b border-n100 last:border-b-0 hover:bg-paper">
                <td className="px-3.5 py-2.5 font-mono text-[12.5px] text-ink">{o.id}</td>
                <td className="px-3.5 py-2.5">{o.placed}</td>
                <td className="num px-3.5 py-2.5">{o.lines.length}</td>
                <td className="px-3.5 py-2.5"><Chip tone={PAY_TONE[o.payment.status]}>{o.payment.statusLabel}</Chip></td>
                <td className="px-3.5 py-2.5"><Chip tone={STATUS_TONE[o.status]}>{o.statusLabel}</Chip></td>
                <td className="num px-3.5 py-2.5 text-right font-semibold text-ink">{inr(o.total)}</td>
                <td className="px-3.5 py-2.5">
                  <Link
                    href={`/orders/${o.id}`}
                    className={
                      "inline-flex h-8 items-center rounded-[2px] px-3 text-[13px] font-semibold " +
                      (o.status === "confirm-receipt"
                        ? "bg-ember-deep text-white hover:bg-ember-press"
                        : "border border-n400 bg-chalk text-ink hover:border-ink")
                    }
                  >
                    {o.status === "confirm-receipt" ? "Confirm" : "Open"}
                  </Link>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-n600">No orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* mobile cards — two-line anatomy: identity line (id · placed),
          then state line (chips left, amount right) */}
      <div className="space-y-3 md:hidden">
        {shown.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[12.5px] text-ink">{o.id}</span>
              <span className="text-[12.5px] text-n600">{o.placed}</span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Chip tone={STATUS_TONE[o.status]}>{o.statusLabel}</Chip>
              <Chip tone={PAY_TONE[o.payment.status]}>{o.payment.statusLabel}</Chip>
              <span className="num ml-auto text-[15px] font-semibold text-ink">{inr(o.total)}</span>
            </div>
          </Link>
        ))}
        {!shown.length && (
          <div className="rounded-[2px] border border-n200 bg-chalk p-8 text-center text-sm text-n600">
            No orders match these filters.
          </div>
        )}
      </div>
      <NoteFlag className="mt-3">cancellation windows pending (p-08 / obd-17) — no cancel actions shown</NoteFlag>
    </>
  );
}
