/** ADR-0016: pure grouping logic for the buyer-facing catalogue — shared
 *  by server/catalog.ts (authoritative, DB-backed) and this module's
 *  tests. Rows sharing a `groupKey` (ADR-0015 colour/size variants of one
 *  model) collapse to ONE representative row per listing/search/related
 *  query; ungrouped rows (groupKey undefined) pass through unchanged. */

interface Groupable {
  sku: string;
  std: number;
  groupKey?: string;
  variantCount?: number;
}

/** Collapses rows sharing a `groupKey` into one representative per group
 *  — the lowest-priced row, tagged with `variantCount` so a card can show
 *  "N options". Group iteration order follows first-occurrence in `rows`,
 *  so the caller's own ordering still governs overall list order. */
export function dedupeGroups<T extends Groupable>(rows: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const p of rows) {
    const key = p.groupKey ?? `__ungrouped__${p.sku}`;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  const out: T[] = [];
  for (const arr of groups.values()) {
    if (arr.length === 1) {
      out.push(arr[0]);
      continue;
    }
    const representative = arr.reduce((cheapest, p) => (p.std < cheapest.std ? p : cheapest));
    out.push({ ...representative, variantCount: arr.length });
  }
  return out;
}
