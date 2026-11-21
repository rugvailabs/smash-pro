/** Pure cost-based pricing math shared by the admin "Add product" live
 *  preview (client) and product creation (server) — the server recomputes
 *  independently from the same raw inputs rather than trusting a
 *  client-submitted total (same price-isolation posture as buyer pricing). */

export type PriceMode = "percent" | "fixed";

/** Resolve a percent-of-`basePaise` or fixed-₹ entry to paise. Caller picks
 *  the base: Purchase/Dealer Price is entered as % of MRP, while ProSmash
 *  Margin (OBD-23 amendment, 2026-11-20 — owner-confirmed, corrects the
 *  flagged assumption in ADR-0011) is entered as % of the resolved
 *  Dealer/Purchase Price, not of MRP. Fixed-₹ mode ignores the base
 *  entirely in both cases — it is already "on top of" whatever it's added
 *  to by the caller's addition, e.g. `stdPaise = purchasePaise + marginPaise`. */
export function resolveToPaise(mode: PriceMode, value: number, basePaise: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return mode === "percent" ? Math.round((basePaise * value) / 100) : Math.round(value * 100);
}

/** Visitor discount vs MRP, one decimal place, floored at 0% — a resolved
 *  selling price at or above MRP is not a "discount" to show a visitor. */
export function visitorDiscountPct(mrpPaise: number, visitorPaise: number): number {
  if (mrpPaise <= 0) return 0;
  return Math.max(0, Math.round(((mrpPaise - visitorPaise) / mrpPaise) * 1000) / 10);
}
