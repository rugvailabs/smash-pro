"use client";

import { useState } from "react";
import { inr } from "@/lib/format";

/* Fixture order history — illustrative data only, no backend. */

interface FixtureOrder {
  id: string;
  placed: string;
  status: "Placed" | "Dispatched" | "Delivered";
  total: number;
  lines: { name: string; qty: number }[];
}
const ORDERS: FixtureOrder[] = [
  { id: "ORD-2026-00042", placed: "12 Nov 2026", status: "Delivered", total: 24850, lines: [{ name: "English Willow Bat — Grade 2, Short Handle", qty: 2 }, { name: "Leather Match Ball — 4-Piece Red, Box of 6", qty: 1 }] },
  { id: "ORD-2026-00051", placed: "02 Nov 2026", status: "Dispatched", total: 9400, lines: [{ name: "Volleyball Posts — Telescopic Steel, Pair", qty: 1 }] },
  { id: "ORD-2026-00058", placed: "18 Oct 2026", status: "Placed", total: 5400, lines: [{ name: "Tour Carbon Racquet — 3U, Head-Heavy", qty: 1 }] },
];
const STATUS_TONE: Record<FixtureOrder["status"], string> = {
  Placed: "bg-info-t text-info",
  Dispatched: "bg-warn-t text-warn",
  Delivered: "bg-ok-t text-ok",
};

export default function OrdersPage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your orders</h1>
      <p className="mt-2 text-[13px] text-n600">Fixture order history — illustrative, not connected to a backend.</p>
      <div className="mt-7 divide-y divide-n200 border-y border-n200">
        {ORDERS.map((o) => {
          const expanded = open === o.id;
          return (
            <div key={o.id}>
              <button type="button" onClick={() => setOpen(expanded ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 py-4 text-left">
                <span className="font-mono text-[13px] text-ink">{o.id}</span>
                <span className="text-[13px] text-n600">{o.placed}</span>
                <span className={"inline-flex h-6 items-center rounded-[2px] px-2 text-xs font-medium " + STATUS_TONE[o.status]}>{o.status}</span>
                <span className="num ml-auto text-[14px] font-semibold text-ink">{inr(o.total)}</span>
                <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 fill-none stroke-n600 transition-transform " + (expanded ? "rotate-180" : "")} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {expanded && (
                <div className="mb-4 rounded-[2px] border border-n200 bg-chalk p-4">
                  <ul className="space-y-1.5 text-[13.5px] text-n800">
                    {o.lines.map((l) => <li key={l.name}>{l.name} × {l.qty}</li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
