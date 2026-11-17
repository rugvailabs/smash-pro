/* ============================================================
   Search suggestions — client fetch over /api/suggest
   (integration point I2). The server composes the groups:
   Products · Categories · Reference IDs (own orders, approved
   buyers only — isolation enforced server-side). No prices in
   suggestions (OBD-03 keeps panels lean).
   ============================================================ */

export interface Suggestion {
  group: "Products" | "Categories" | "Reference IDs";
  label: string;
  /** secondary text: SKU for products, count for categories, status for refs */
  meta?: string;
  href: string;
}

export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<Suggestion[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  return res.json() as Promise<Suggestion[]>;
}
