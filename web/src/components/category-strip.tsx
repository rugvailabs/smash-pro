import Link from "next/link";
import type { Category } from "@/lib/types";

/* ============================================================
   Public category strip (library §5): the 12 sports as flat
   tiles — hairline separators, hover underline, active = 2px
   Ember bottom rule. Scrollable with edge-fade below xl.
   Shared by the catalogue and search pages so search reads as
   a view of the same catalogue, not a separate tool.
   ============================================================ */

export function CategoryStrip({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <nav aria-label="Sport categories" className="edge-fade-x flex overflow-x-auto border-b border-n200 bg-paper">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/catalog?cat=${c.slug}`}
          aria-current={c.slug === active ? "page" : undefined}
          className={
            "group shrink-0 border-r border-n200 px-5 py-3.5 first:border-l " +
            (c.slug === active ? "shadow-[inset_0_-2px_0_var(--color-ember)]" : "")
          }
        >
          <span className="block whitespace-nowrap font-display text-sm font-semibold text-ink underline-offset-4 group-hover:underline">
            {c.name}
          </span>
          <span className="num font-mono text-[10px] text-n600">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
