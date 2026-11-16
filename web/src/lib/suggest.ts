import { CATEGORIES, PRODUCTS } from "@/data/products";
import { ORDERS } from "@/data/buyer";
import type { Role } from "@/lib/types";

/* ============================================================
   Search suggestions (library §3) — synchronous client-side index
   over the preview sample data. API BOUNDARY NOTE: with a backend
   this module's body is replaced by a suggest endpoint; the shape
   of `Suggestion` and `suggest()` is the contract.
   Groups: Products · Categories · Reference IDs (signed-in buyer).
   No prices in suggestions (OBD-03 keeps panels lean).
   ============================================================ */

export interface Suggestion {
  group: "Products" | "Categories" | "Reference IDs";
  label: string;
  /** secondary text: SKU for products, count for categories, status for refs */
  meta?: string;
  href: string;
}

const MIN_CHARS = 2;
const MAX_PER_GROUP = 4;

export function suggest(q: string, role: Role): Suggestion[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < MIN_CHARS) return [];
  const out: Suggestion[] = [];

  for (const p of PRODUCTS) {
    if (`${p.name} ${p.sub} ${p.sku}`.toLowerCase().includes(needle)) {
      out.push({ group: "Products", label: p.name, meta: p.sku, href: `/product/${p.sku}` });
      if (out.length >= MAX_PER_GROUP) break;
    }
  }

  let cats = 0;
  for (const c of CATEGORIES) {
    if (c.name.toLowerCase().includes(needle)) {
      out.push({ group: "Categories", label: c.name, meta: `${c.count} products`, href: `/catalog?cat=${c.slug}` });
      if (++cats >= MAX_PER_GROUP) break;
    }
  }

  // Reference IDs are portal-only: approved buyers see their own order ids.
  if (role === "buyer") {
    let refs = 0;
    for (const o of ORDERS) {
      if (o.id.toLowerCase().includes(needle)) {
        out.push({ group: "Reference IDs", label: o.id, meta: o.statusLabel, href: `/orders/${o.id}` });
        if (++refs >= MAX_PER_GROUP) break;
      }
    }
  }

  return out;
}
