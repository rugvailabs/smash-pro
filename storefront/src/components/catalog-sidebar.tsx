"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRICE_BANDS } from "@/lib/filter-defs";

function Row({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={"flex w-full items-center gap-2.5 rounded-[2px] px-2 py-1.5 text-left text-[13.5px] transition-colors " + (active ? "font-semibold text-ink" : "text-n800 hover:text-ink")}>
      <span aria-hidden className={"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " + (active ? "border-ember-deep" : "border-n400")}>
        {active && <span className="h-2 w-2 rounded-full bg-ember-deep" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-n100 py-4 first:pt-0 last:border-b-0">
      <h3 className="mb-2 px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[.12em] text-ember-deep">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function CatalogSidebar({ types, typeLabel = "Equipment" }: { types: string[]; typeLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const type = params.get("type") ?? "";
  const price = params.get("price") ?? "";

  const setParam = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);
  const clearAll = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("type"); next.delete("price");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const activeCount = (type ? 1 : 0) + (price ? 1 : 0);

  return (
    <div className="lg:sticky lg:top-[130px]">
      <button type="button" onClick={() => setOpenMobile((o) => !o)} aria-expanded={openMobile} className="flex h-10 w-full items-center justify-between rounded-[2px] border border-n400 bg-chalk px-3 text-sm font-semibold text-ink lg:hidden">
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          Filters{activeCount > 0 && <span className="num rounded-[2px] bg-ember-deep px-1.5 text-[11px] text-white">{activeCount}</span>}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 fill-none stroke-current transition-transform " + (openMobile ? "rotate-180" : "")} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <aside aria-label="Product filters" className={(openMobile ? "mt-2 block" : "hidden") + " rounded-[2px] border border-n200 bg-chalk p-4 lg:mt-0 lg:block lg:border-0 lg:bg-transparent lg:p-0"}>
        <div className="mb-3 hidden items-baseline justify-between lg:flex">
          <span className="font-display text-[15px] font-bold text-ink">Filters</span>
          {activeCount > 0 && <button onClick={clearAll} className="text-[12px] font-semibold text-ember-deep underline-offset-2 hover:underline">Clear all</button>}
        </div>
        <Group title={typeLabel}>
          <Row label="All" active={type === ""} onClick={() => setParam("type", "")} />
          {types.map((t) => <Row key={t} label={t} active={type === t} onClick={() => setParam("type", t)} />)}
        </Group>
        <Group title="Price">
          <Row label="Any price" active={price === ""} onClick={() => setParam("price", "")} />
          {Object.entries(PRICE_BANDS).map(([k, b]) => <Row key={k} label={b.label} active={price === k} onClick={() => setParam("price", k)} />)}
        </Group>
        {activeCount > 0 && <button onClick={clearAll} className="mt-3 text-[13px] font-semibold text-ember-deep underline-offset-2 hover:underline lg:hidden">Clear all filters</button>}
      </aside>
    </div>
  );
}
