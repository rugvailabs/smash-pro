"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRICE_BANDS, SORTS } from "@/lib/filter-defs";

/* ============================================================
   Catalogue grid toolbar — the row above the product grid:
   live result count (server-supplied), removable active-filter
   chips with Clear all, and the Sort control. URL-driven so the
   server component re-renders; pairs with the sidebar filters.
   ============================================================ */

export function CatalogToolbar({ shown, total }: { shown: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? "";
  const price = params.get("price") ?? "";
  const sort = params.get("sort") ?? "relevance";
  const view = params.get("view") === "list" ? "list" : "grid";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value); else next.delete(key);
      // view is presentation-only (same items, same order) — everything
      // else (sort, filters) can reorder/shrink the result set
      if (key !== "view") next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );
  const clearAll = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("type"); next.delete("price"); next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const tokens: { key: string; label: string }[] = [];
  if (type) tokens.push({ key: "type", label: type });
  if (price && PRICE_BANDS[price]) tokens.push({ key: "price", label: PRICE_BANDS[price].label });

  return (
    <div className="border-b border-n100 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="num font-mono text-xs text-n600">
          <b className="text-ink">{shown}</b>{shown !== total && <> of {total}</>} items · sample
        </span>

        {/* grid / list view toggle — presentation only, no data change */}
        <div className="ml-auto flex items-center gap-0.5 rounded-[2px] border border-n400 p-0.5">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setParam("view", "")}
            className={"flex h-8 w-8 items-center justify-center rounded-[1px] transition-colors " + (view === "grid" ? "bg-ink text-chalk" : "text-n600 hover:text-ink")}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
              <rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" />
              <rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setParam("view", "list")}
            className={"flex h-8 w-8 items-center justify-center rounded-[1px] transition-colors " + (view === "list" ? "bg-ink text-chalk" : "text-n600 hover:text-ink")}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-n600">
          <span className="hidden sm:inline">Sort</span>
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "relevance" ? "" : e.target.value)}
            className="h-10 rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
          >
            {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
      </div>

      {tokens.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tokens.map((t) => (
            <button
              key={t.key}
              onClick={() => setParam(t.key, "")}
              aria-label={`Remove filter ${t.label}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-n400 bg-paper px-2.5 text-xs font-medium text-ink transition-colors hover:border-ember-deep hover:text-ember-deep"
            >
              {t.label}
              <span aria-hidden className="text-[13px] leading-none">×</span>
            </button>
          ))}
          <button onClick={clearAll} className="text-[13px] font-semibold text-ember-deep underline-offset-2 hover:underline">Clear all</button>
        </div>
      )}
    </div>
  );
}
