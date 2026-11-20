/** Pure cost-based pricing math shared by the admin "Add product" live
 *  preview (client) and product creation (server) — the server recomputes
 *  independently from the same raw inputs rather than trusting a
 *  client-submitted total (same price-isolation posture as buyer pricing). */

export type PriceMode = "percent" | "fixed";

/** Resolve a percent-of-MRP or fixed-₹ entry to paise. Percent is of MRP,
 *  not of purchase price, for both purchase price and margin — so an admin
 *  pricing by "cost is 65% of MRP, margin is 10% of MRP" gets consistent
 *  numbers without doing the arithmetic by hand. */
export function resolveToPaise(mode: PriceMode, value: number, mrpPaise: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return mode === "percent" ? Math.round((mrpPaise * value) / 100) : Math.round(value * 100);
}

/** Visitor discount vs MRP, one decimal place, floored at 0% — a resolved
 *  selling price at or above MRP is not a "discount" to show a visitor. */
export function visitorDiscountPct(mrpPaise: number, visitorPaise: number): number {
  if (mrpPaise <= 0) return 0;
  return Math.max(0, Math.round(((mrpPaise - visitorPaise) / mrpPaise) * 1000) / 10);
}
