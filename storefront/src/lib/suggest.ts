import { CATEGORIES, PRODUCTS } from "@/data/products";

/* ============================================================
   Search suggestions — computed client-side directly over the static
   fixture catalogue (ADR-0008: no backend, no API route). Groups mirror
   the pattern used elsewhere in the project (Products / Categories) —
   no prices surfaced in the panel, consistent with the real app's rule.
   ============================================================ */

export interface Suggestion {
  group: "Products" | "Categories";
  label: string;
  meta?: string;
  href: string;
}

export function getSuggestions(q: string, limit = 8): Suggestion[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const out: Suggestion[] = [];

  for (const c of CATEGORIES) {
    if (c.name.toLowerCase().includes(needle)) {
      out.push({ group: "Categories", label: c.name, meta: `${c.count} products`, href: `/catalog/${c.slug}` });
      if (out.length >= 3) break;
    }
  }

  for (const p of PRODUCTS) {
    if (`${p.name} ${p.sub} ${p.sku}`.toLowerCase().includes(needle)) {
      out.push({ group: "Products", label: p.name, meta: p.sku, href: `/product/${p.sku}` });
      if (out.length >= limit) break;
    }
  }

  return out;
}

/* ---------- local search history (localStorage, client-only) ---------- */

const HISTORY_KEY = "sp-sf-search-history";
const HISTORY_MAX = 8;

export function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function pushSearchHistory(term: string): void {
  if (typeof window === "undefined") return;
  const q = term.trim();
  if (!q) return;
  const next = [q, ...loadSearchHistory().filter((h) => h.toLowerCase() !== q.toLowerCase())].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — history is a convenience, not critical */
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
