"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRICE_BANDS, SORTS } from "@/lib/filter-defs";

/* ============================================================
   Catalogue filter bar (library §10) — URL-driven so the server
   component re-renders the filtered grid: ?type= &price= &sort=.
   Applied filters render as removable tokens with "Clear all".
   Three controls fit one wrapping row at every width; the drawer
   collapse pattern activates when the filter set grows.
   Definitions live in lib/filter-defs.ts (server-safe — see the
   note there; this file is "use client").
   ============================================================ */

export function CatalogFilters({ types, typeLabel = "Type" }: { types: string[]; typeLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? "";
  const price = params.get("price") ?? "";
  const sort = params.get("sort") ?? "relevance";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value); else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("type");
    next.delete("price");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const selectCls =
    "h-10 rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none";
  const tokens: { key: string; label: string }[] = [];
  if (type) tokens.push({ key: "type", label: type });
  if (price && PRICE_BANDS[price]) tokens.push({ key: "price", label: PRICE_BANDS[price].label });

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      <select aria-label={typeLabel} className={selectCls} value={type} onChange={(e) => setParam("type", e.target.value)}>
        <option value="">{typeLabel}: All</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select aria-label="Price" className={selectCls} value={price} onChange={(e) => setParam("price", e.target.value)}>
        <option value="">Price: Any</option>
        {Object.entries(PRICE_BANDS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}
      </select>
      <select aria-label="Sort" className={selectCls} value={sort} onChange={(e) => setParam("sort", e.target.value === "relevance" ? "" : e.target.value)}>
        {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>Sort: {label}</option>)}
      </select>
      {tokens.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          <span aria-hidden className="h-5 w-px bg-n200 max-md:hidden" />
          {tokens.map((t) => (
            <button
              key={t.key}
              onClick={() => setParam(t.key, "")}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-n400 bg-paper px-2.5 text-xs font-medium text-ink transition-colors hover:border-ember-deep hover:text-ember-deep"
              aria-label={`Remove filter ${t.label}`}
            >
              {t.label}
              <span aria-hidden className="text-[13px] leading-none">×</span>
            </button>
          ))}
          <button onClick={clearAll} className="text-[13px] font-semibold text-ember-deep underline-offset-2 hover:underline">
            Clear all
          </button>
        </span>
      )}
    </div>
  );
}
